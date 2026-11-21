#!/usr/bin/env bash
# Daily, from cron: starts a new web server log each day and removes logs older than 14 days.
# The Privacy Policy promises exactly this. Run by root:  /etc/cron.d/lindrize-logs
set -euo pipefail
cd /var/log/lindrize
day="$(date +%F)"
for name in access error; do
  [[ -s "$name.log" ]] || continue
  # Copy, then empty the file in place: Nginx keeps writing to the same file.
  cp -p "$name.log" "$name-$day.log" && : > "$name.log"
  gzip -f "$name-$day.log"
done
find /var/log/lindrize -name '*-*.log.gz' -mtime +13 -delete
