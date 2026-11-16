#!/usr/bin/env bash
# Copies the Lindrize web server files from this folder into Nginx, tests them, and reloads
# Nginx only if the test passes. Safe to run again after every update.
#   sudo /srv/lindrize/repo/server/install-nginx.sh
# It does not switch any address on or off: that is done once, by hand, in docs/SERVER-SETUP.md.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
[[ "$(id -u)" == 0 ]] || { echo "Run this with sudo."; exit 1; }

install -m 644 "$here/nginx/lindrize-zones.conf" /etc/nginx/conf.d/lindrize-zones.conf
for name in tls headers site; do
  install -m 644 "$here/nginx/snippets/lindrize-$name.conf" "/etc/nginx/snippets/lindrize-$name.conf"
done
install -m 644 "$here/nginx/lindrize-http.conf" /etc/nginx/sites-available/lindrize-http.conf
install -m 644 "$here/nginx/lindrize.conf" /etc/nginx/sites-available/lindrize.conf
install -m 644 "$here/nginx/stats.conf" /etc/nginx/sites-available/lindrize-stats.conf
# The test address has two versions; keep whichever one is in use.
[[ -f /etc/nginx/sites-available/lindrize-preview.conf ]] ||
  install -m 644 "$here/nginx/lindrize-preview.conf" /etc/nginx/sites-available/lindrize-preview.conf
install -m 755 "$here/deploy-gate.sh" /usr/local/bin/lindrize-deploy-gate
install -d -m 755 /var/www/certbot

if nginx -t; then
  systemctl reload nginx
  echo "Installed, tested and reloaded."
else
  echo
  echo "The test failed, so Nginx was NOT reloaded and keeps running with its previous settings."
  echo "Copy the lines above and send them before doing anything else."
  exit 1
fi
