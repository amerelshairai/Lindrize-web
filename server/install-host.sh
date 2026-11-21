#!/usr/bin/env bash
# Installs the small pieces the website needs outside its containers. Changes nothing for n8n
# or Traefik. Safe to run again after every update.
#   sudo /srv/lindrize/repo/server/install-host.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
[[ "$(id -u)" == 0 ]] || { echo "Run this with sudo."; exit 1; }

# The only program the publishing key may run.
install -m 755 "$here/deploy-gate.sh" /usr/local/bin/lindrize-deploy-gate
# The web server container runs as user 101 and writes its logs here.
install -d -m 750 -o 101 -g 101 /var/log/lindrize
# Daily log clean-up (14 days) and nightly visitor-count backup.
printf '7 0 * * * root %s/rotate-logs.sh\n' "$here" > /etc/cron.d/lindrize-logs
printf '17 3 * * * root %s/backup-umami.sh\n' "$here" > /etc/cron.d/lindrize-backup
chmod 644 /etc/cron.d/lindrize-logs /etc/cron.d/lindrize-backup
echo "Installed."
