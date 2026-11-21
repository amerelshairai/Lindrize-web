#!/usr/bin/env bash
# Shortcut for the website's containers (web, email receiver, Umami, its database).
# It always uses the right files, and adds the launch-day file once LINDRIZE_STAGE=live.
# It never touches n8n or Traefik.
#
#   sudo /srv/lindrize/repo/server/services.sh up -d          start, or apply changes
#   sudo /srv/lindrize/repo/server/services.sh ps             are they running?
#   sudo /srv/lindrize/repo/server/services.sh logs receiver  what the receiver did
#   sudo /srv/lindrize/repo/server/services.sh update         fetch the newest code and rebuild
set -euo pipefail
BASE=/srv/lindrize
files=(-f "$BASE/repo/server/docker-compose.yml")
if grep -qx 'LINDRIZE_STAGE=live' "$BASE/.env" 2>/dev/null; then
  files+=(-f "$BASE/repo/server/docker-compose.live.yml")
fi
compose() { docker compose --project-directory "$BASE" "${files[@]}" --env-file "$BASE/.env" "$@"; }

if [[ "${1:-}" == "update" ]]; then
  git -C "$BASE/repo" pull --ff-only
  compose pull web umami db
  compose up -d --build
  docker image prune -f >/dev/null
  compose ps
  exit 0
fi
compose "$@"
