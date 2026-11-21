#!/usr/bin/env bash
# Runs the website container's real Nginx files on a spare port, with stand-ins for the
# receiver and Umami, and checks what visitors would get. Traefik is played by curl: it sends
# the Host header and the visitor's address in X-Forwarded-For, as Traefik does.
# Needs: nginx, curl, node, and a built site in site/dist.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
[[ -f "$repo/site/dist/index.html" ]] || { echo "Build the site first (npm run build in site/)."; exit 1; }
work="$(mktemp -d)"
stub=""
cleanup() {
  if [[ -f "$work/nginx.pid" ]]; then kill "$(cat "$work/nginx.pid")" 2>/dev/null || true; fi
  if [[ -n "$stub" ]]; then kill "$stub" 2>/dev/null || true; fi
  rm -rf "$work"
}
trap cleanup EXIT

stage="${1:-preview}"
mkdir -p "$work/lindrize" "$work/www/releases" "$work/tmp"
ln -s "$repo/site/dist" "$work/www/current"

# The same files that go into the container, with only ports, folders and names swapped.
adapt() {
  sed -E \
    -e 's/listen 8080/listen 18080/' \
    -e "s#/etc/nginx/lindrize/#$work/lindrize/#g" \
    -e "s#/var/www/lindrize/current#$work/www/current#" \
    -e "s#/var/log/lindrize/#$work/#" \
    -e 's#http://receiver:8080#http://127.0.0.1:18081#; s#http://umami:3000#http://127.0.0.1:18082#' \
    -e 's#^set_real_ip_from 10\.0\.0\.0/8;#set_real_ip_from 127.0.0.1;\nset_real_ip_from 10.0.0.0/8;#' \
    "$1" > "$2"
}
adapt "$here/../nginx/lindrize.conf" "$work/default.conf"
adapt "$here/../nginx/site.conf" "$work/lindrize/site.conf"
adapt "$here/../nginx/headers.conf" "$work/lindrize/headers.conf"
if [[ "$stage" == live ]]; then preview=after; else preview=before; fi
adapt "$here/../nginx/preview-$preview-launch.conf" "$work/lindrize/preview.conf"

user_line=""; [[ "$(id -u)" == 0 ]] && user_line="user root;"
cat > "$work/nginx.conf" <<CONF
$user_line
pid $work/nginx.pid;
error_log $work/startup.log;
events {}
http {
  include /etc/nginx/mime.types;
  client_body_temp_path $work/tmp; proxy_temp_path $work/tmp; fastcgi_temp_path $work/tmp;
  uwsgi_temp_path $work/tmp; scgi_temp_path $work/tmp;
  include $work/default.conf;
}
CONF

node -e '
const http = require("node:http");
const serve = (port, name) => http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ name, method: req.method, url: req.url, ip: req.headers["x-real-ip"] ?? null, fwd: req.headers["x-forwarded-for"] ?? null }));
}).listen(port, "127.0.0.1");
serve(18081, "receiver"); serve(18082, "umami");' &
stub=$!

nginx -p "$work" -c "$work/nginx.conf" -t 2>&1 | sed 's/^/  /'
nginx -p "$work" -c "$work/nginx.conf"
sleep 1

fails=0
ok() { echo "✓ $1"; }
bad() { echo "✗ $1"; fails=$((fails + 1)); }
# A visit as Traefik passes it on: the address, and the visitor's real address.
at() { local host="$1"; shift; curl -s --noproxy '*' -H "Host: $host" -H 'X-Forwarded-For: 203.0.113.7' "$@"; }
status() { at "$1" -o /dev/null -w '%{http_code}' "http://127.0.0.1:18080$2" "${@:3}"; }
header() { at "$2" -o /dev/null -D - "http://127.0.0.1:18080$3" "${@:4}" | tr -d '\r' | grep -i "^$1:" | head -1 | cut -d' ' -f2-; }
body() { at "$1" "http://127.0.0.1:18080$2" "${@:3}"; }
expect() { if [[ "$2" == "$3" ]]; then ok "$1"; else bad "$1 (got \"$2\", expected \"$3\")"; fi; }
M=lindrize.online

expect "home page" "$(status $M /)" 200
expect "Arabic home page" "$(status $M /ar/)" 200
expect "a system page" "$(status $M /solutions/)" 200
expect "address without the final slash is corrected" "$(header location $M /pricing)" "/pricing/"
expect "unknown page shows the not-found page" "$(status $M /nope/)" 404
if [[ "$(body $M /nope/)" == *'<html lang="en"'* ]]; then ok "English not-found page"; else bad "English not-found page"; fi
if [[ "$(body $M /ar/nope/)" == *'<html lang="ar"'* ]]; then ok "Arabic not-found page"; else bad "Arabic not-found page"; fi
expect "/book goes to Calendly" "$(header location $M /book)" "https://calendly.com/amerelshair-ai-lindrize/15-minute-call-with-lindrize"
expect "www goes to the main address" "$(header location www.lindrize.online '/pricing/?a=1')" "https://lindrize.online/pricing/?a=1"
expect "an unknown address gets nothing" "$(status other.example /)" 000
expect "hidden files are not served" "$(status $M /.env)" 404

asset="$(find "$repo/site/dist/_astro" -maxdepth 1 -name '*.js' -printf '%f\n' | head -1)"
for path in / /ar/ /nope/ "/_astro/$asset" /favicon.svg; do
  for h in strict-transport-security x-content-type-options x-frame-options referrer-policy permissions-policy content-security-policy; do
    [[ -n "$(header "$h" $M "$path")" ]] || bad "$path is missing the $h header"
  done
done
ok "security headers checked on pages, files and the not-found page"
expect "no server version shown" "$(header server $M /)" "nginx"
expect "pages are always re-checked" "$(header cache-control $M /)" "no-cache"
expect "scripts and fonts are kept for a year" "$(header cache-control $M "/_astro/$asset")" "public, max-age=31536000, immutable"
expect "icons are kept for a day" "$(header cache-control $M /favicon.svg)" "public, max-age=86400"
expect "pages are compressed" "$(header content-encoding $M / -H 'Accept-Encoding: gzip')" "gzip"
expect "sitemap is served as XML" "$(header content-type $M /sitemap.xml)" "text/xml; charset=utf-8"
expect "llms.txt is served as text" "$(header content-type $M /llms.txt)" "text/plain; charset=utf-8"

design="$(body $M /api/design -X POST -H 'content-type: application/json' -H 'X-Real-IP: 6.6.6.6' -d '{}')"
if [[ "$design" == *'"name":"receiver"'*'"url":"/api/design"'* ]]; then ok "design form reaches the receiver"; else bad "design form reaches the receiver: $design"; fi
if [[ "$design" == *'"ip":"203.0.113.7"'*'"fwd":"203.0.113.7"'* ]]; then ok "the receiver gets the visitor's real address, which a visitor cannot fake"; else bad "visitor address: $design"; fi
expect "the receiver accepts POST only" "$(status $M /api/design)" 403
expect "no other /api address exists" "$(status $M /api/health)" 404
expect "an oversized request is refused" "$(head -c 40000 /dev/zero | tr '\0' a | at $M -o /dev/null -w '%{http_code}' -X POST --data-binary @- http://127.0.0.1:18080/api/design)" 413
if [[ "$(body $M /u/script.js)" == *'"name":"umami"'*'"url":"/script.js"'* ]]; then ok "counting script comes from Umami"; else bad "counting script"; fi
if [[ "$(body $M /u/api/send -X POST -d '{}')" == *'"url":"/api/send"'*'"ip":"203.0.113.7"'* ]]; then ok "counting reaches Umami with the real address"; else bad "counting reaches Umami"; fi
expect "the Umami dashboard is not reachable through the site" "$(status $M /u/login)" 404

codes=""; for _ in $(seq 1 12); do codes+="$(status $M /api/design -X POST -d '{}') "; done
if [[ "$codes" == *429* ]]; then ok "too many design requests are slowed down"; else bad "no request limit: $codes"; fi

P=new.lindrize.online
if [[ "$stage" == live ]]; then
  expect "after launch the test address forwards to the main one" "$(header location $P /faq/)" "https://lindrize.online/faq/"
else
  expect "test address shows the site" "$(status $P /)" 200
  expect "test address is hidden from search engines" "$(header x-robots-tag $P /)" "noindex, nofollow"
fi
if [[ -z "$(header x-robots-tag $M /)" ]]; then ok "the main address is not hidden from search engines"; else bad "main address is hidden"; fi
S=stats.lindrize.online
if [[ "$(body $S /dashboard)" == *'"name":"umami"'* ]]; then ok "stats address reaches Umami"; else bad "stats address"; fi
expect "stats address is hidden from search engines" "$(header x-robots-tag $S /)" "noindex, nofollow"

body $M /about/ -H 'User-Agent: log-probe' > /dev/null
sleep 0.3
probe="$(grep log-probe "$work/access.log" | tail -1)"
if [[ "$probe" == 203.0.113.0\ * ]]; then ok "the access log keeps only shortened visitor addresses"; else bad "access log: $probe"; fi
if grep -q '203\.0\.113\.7' "$work/access.log"; then bad "full address in the access log"; else ok "no full address in the access log"; fi

if [[ "$fails" == 0 ]]; then echo "✓ All web server checks passed ($stage)"; else echo "✗ $fails web server check(s) failed ($stage)"; tail -5 "$work/error.log" 2>/dev/null || true; exit 1; fi
