#!/usr/bin/env bash
# Nightly copy of the visitor-count database. Keeps 14 days. Run by root from cron:
#   /etc/cron.d/lindrize-backup
set -euo pipefail
umask 077

BASE=/srv/lindrize
DEST="$BASE/backups"
FILE="$DEST/umami-$(date +%F).sql.gz"
mkdir -p "$DEST"

"$BASE/repo/server/services.sh" exec -T db pg_dump -U umami --no-owner umami | gzip -9 > "$FILE.part"
# A real backup is never tiny. Keep the old ones if this one looks wrong.
if [[ "$(stat -c %s "$FILE.part")" -lt 1000 ]]; then
  rm -f "$FILE.part"
  echo "Umami backup failed: the file was almost empty." >&2
  exit 1
fi
mv "$FILE.part" "$FILE"
find "$DEST" -name 'umami-*.sql.gz' -mtime +14 -delete
