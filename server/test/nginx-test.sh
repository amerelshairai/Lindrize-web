#!/usr/bin/env bash
# Runs the real Nginx files on spare ports with a throwaway certificate and stand-ins for the
# receiver and Umami, then checks what visitors would get. Needs: nginx, openssl, curl, node,
# and a built site in site/dist.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
[[ -f "$repo/site/dist/index.html" ]] || { echo "Build the site first (npm run build in site/)."; exit 1; }
work="$(mktemp -d)"
cleanup() {
  [[ -f "$work/nginx.pid" ]] && kill "$(cat "$work/nginx.pid")" 2>/dev/null || true
  [[ -n "${stub:-}" ]] && kill "$stub" 2>/dev/null || true
  rm -rf "$work"
}
trap cleanup EXIT

mkdir -p "$work/conf/snippets" "$work/conf/sites" "$work/www/releases" "$work/certbot/.well-known/acme-challenge" "$work/tmp"
ln -s "$repo/site/dist" "$work/www/current"
echo token > "$work/certbot/.well-known/acme-challenge/probe"
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj "/CN=test" \
  -keyout "$work/key.pem" -out "$work/cert.pem" >/dev/null 2>&1

# The same files that go on the server, with only ports and folders swapped.
adapt() {
  sed -E \
    -e '/listen \[::\]/d' \
    -e 's/listen 80;/listen 18080;/' \
    -e 's/listen 443 ssl http2;/listen 18443 ssl http2;/' \
    -e "s#/etc/letsencrypt/live/[a-z.]+/fullchain.pem#$work/cert.pem#" \
    -e "s#/etc/letsencrypt/live/[a-z.]+/privkey.pem#$work/key.pem#" \
    -e "s#/var/www/lindrize/current#$work/www/current#" \
    -e "s#/var/www/certbot#$work/certbot#" \
    -e "s#/var/log/nginx/#$work/#" \
    -e 's#127\.0\.0\.1:8081#127.0.0.1:18081#; s#127\.0\.0\.1:8082#127.0.0.1:18082#' \
    "$1" > "$2"
}
for f in "$here"/../nginx/snippets/*.conf; do
  [[ "$f" == *brotli* ]] || adapt "$f" "$work/conf/snippets/$(basename "$f")"
done
for f in lindrize-http lindrize-preview lindrize stats; do adapt "$here/../nginx/$f.conf" "$work/conf/sites/$f.conf"; done
adapt "$here/../nginx/lindrize-zones.conf" "$work/conf/zones.conf"
user_line=""; [[ "$(id -u)" == 0 ]] && user_line="user root;"
cat > "$work/conf/nginx.conf" <<CONF
$user_line
pid $work/nginx.pid;
error_log $work/error.log;
events {}
http {
  include /etc/nginx/mime.types;
  access_log off;
  client_body_temp_path $work/tmp; proxy_temp_path $work/tmp; fastcgi_temp_path $work/tmp;
  uwsgi_temp_path $work/tmp; scgi_temp_path $work/tmp;
  include zones.conf;
  include sites/*.conf;
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

nginx -p "$work" -c "$work/conf/nginx.conf" -t 2>&1 | sed 's/^/  /'
nginx -p "$work" -c "$work/conf/nginx.conf"
sleep 1

fails=0
ok() { echo "✓ $1"; }
bad() { echo "✗ $1"; fails=$((fails + 1)); }
R=(--resolve www.lindrize.online:18443:127.0.0.1 --resolve lindrize.online:18443:127.0.0.1
   --resolve new.lindrize.online:18443:127.0.0.1 --resolve stats.lindrize.online:18443:127.0.0.1
   --resolve www.lindrize.online:18080:127.0.0.1 --resolve lindrize.online:18080:127.0.0.1)
get() { curl -sk --noproxy '*' --http2 "${R[@]}" "$@"; }
status() { get -o /dev/null -w '%{http_code}' "$@"; }
header() { get -o /dev/null -D - "${@:2}" | tr -d '\r' | grep -i "^$1:" | head -1 | cut -d' ' -f2-; }
expect() { [[ "$2" == "$3" ]] && ok "$1" || bad "$1 (got \"$2\", expected \"$3\")"; }
W=https://lindrize.online:18443

expect "home page" "$(status $W/)" 200
expect "Arabic home page" "$(status $W/ar/)" 200
expect "a system page" "$(status $W/solutions/)" 200
expect "address without the final slash is corrected" "$(header location $W/pricing)" "/pricing/"
expect "unknown page shows the not-found page" "$(status $W/nope/)" 404
[[ "$(get $W/nope/)" == *'<html lang="en"'* ]] && ok "English not-found page" || bad "English not-found page"
[[ "$(get $W/ar/nope/)" == *'<html lang="ar"'* ]] && ok "Arabic not-found page" || bad "Arabic not-found page"
expect "/book goes to Calendly" "$(header location $W/book)" "https://calendly.com/amerelshair-ai-lindrize/15-minute-call-with-lindrize"
expect "www goes to the main address" "$(header location https://www.lindrize.online:18443/pricing/?a=1)" "https://lindrize.online/pricing/?a=1"
expect "http goes to https" "$(header location http://lindrize.online:18080/faq/)" "https://lindrize.online/faq/"
expect "certificate check folder answers on port 80" "$(get http://lindrize.online:18080/.well-known/acme-challenge/probe)" "token"
expect "hidden files are not served" "$(status $W/.env)" 404

for path in / /ar/ /nope/ /_astro/$(ls "$repo/site/dist/_astro" | grep '\.js$' | head -1) /favicon.svg; do
  for h in strict-transport-security x-content-type-options x-frame-options referrer-policy permissions-policy content-security-policy; do
    [[ -n "$(header $h $W$path)" ]] || bad "$path is missing the $h header"
  done
done
ok "security headers checked on pages, files and the not-found page"
expect "no server version shown" "$(header server $W/)" "nginx"
expect "pages are always re-checked" "$(header cache-control $W/)" "no-cache"
asset="$(find "$repo/site/dist/_astro" -maxdepth 1 -name '*.js' -printf '%f\n' | head -1)"
expect "scripts and fonts are kept for a year" "$(header cache-control "$W/_astro/$asset")" "public, max-age=31536000, immutable"
expect "icons are kept for a day" "$(header cache-control $W/favicon.svg)" "public, max-age=86400"
expect "pages are compressed" "$(header content-encoding -H 'Accept-Encoding: gzip' $W/)" "gzip"
expect "sitemap is served as XML" "$(header content-type $W/sitemap.xml)" "text/xml; charset=utf-8"
expect "llms.txt is served as text" "$(header content-type $W/llms.txt)" "text/plain; charset=utf-8"

design="$(get -X POST -H 'content-type: application/json' -H 'X-Real-IP: 6.6.6.6' -H 'X-Forwarded-For: 6.6.6.6' -d '{}' $W/api/design)"
[[ "$design" == *'"name":"receiver"'*'"url":"/api/design"'* ]] && ok "design form reaches the receiver" || bad "design form reaches the receiver: $design"
[[ "$design" == *'"ip":"127.0.0.1"'*'"fwd":"127.0.0.1"'* ]] && ok "a visitor cannot fake their address" || bad "visitor address can be faked: $design"
expect "the receiver accepts POST only" "$(status $W/api/design)" 403
expect "no other /api address exists" "$(status $W/api/health)" 404
expect "an oversized request is refused" "$(head -c 40000 /dev/zero | tr '\0' a | get -o /dev/null -w '%{http_code}' -X POST --data-binary @- $W/api/design)" 413
[[ "$(get $W/u/script.js)" == *'"name":"umami"'*'"url":"/script.js"'* ]] && ok "counting script comes from Umami" || bad "counting script"
[[ "$(get -X POST -d '{}' $W/u/api/send)" == *'"url":"/api/send"'* ]] && ok "counting reaches Umami" || bad "counting reaches Umami"
expect "the Umami dashboard is not reachable through the site" "$(status $W/u/login)" 404

codes=""; for _ in $(seq 1 12); do codes+="$(status -X POST -d '{}' $W/api/design) "; done
[[ "$codes" == *429* ]] && ok "too many design requests are slowed down" || bad "no request limit: $codes"

P=https://new.lindrize.online:18443
expect "test address shows the site" "$(status $P/)" 200
expect "test address is hidden from search engines" "$(header x-robots-tag $P/)" "noindex, nofollow"
[[ -z "$(header x-robots-tag $W/)" ]] && ok "the real address is not hidden from search engines" || bad "real address is hidden"
S=https://stats.lindrize.online:18443
[[ "$(get $S/dashboard)" == *'"name":"umami"'* ]] && ok "stats address reaches Umami" || bad "stats address"
expect "stats address is hidden from search engines" "$(header x-robots-tag $S/)" "noindex, nofollow"

get -o /dev/null $W/about/ -H 'User-Agent: log-probe'
sleep 0.3
probe="$(grep log-probe "$work/lindrize.access.log" | tail -1)"
[[ "$probe" == 127.0.0.0\ * ]] && ok "the access log keeps only shortened visitor addresses" || bad "access log: $probe"
[[ "$(grep -c '127\.0\.0\.1' "$work/lindrize.access.log")" == 0 ]] && ok "no full address in the access log" || bad "full address in access log"

[[ "$fails" == 0 ]] && echo "✓ All web server checks passed" || { echo "✗ $fails web server check(s) failed"; tail -5 "$work/error.log"; exit 1; }
