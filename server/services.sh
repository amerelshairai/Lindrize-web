#!/usr/bin/env bash
# Shortcut for the three background services (email receiver, Umami, its database).
# It always uses the right files, so the commands in the guides stay short.
#
#   sudo /srv/lindrize/repo/server/services.sh up -d          start, or apply changes
#   sudo /srv/lindrize/repo/server/services.sh ps             are they running?
#   sudo /srv/lindrize/repo/server/services.sh logs receiver  what the receiver did
#   sudo /srv/lindrize/repo/server/services.sh update         fetch the newest code and rebuild
set -euo pipefail
BASE=/srv/lindrize
compose() { docker compose --project-directory "$BASE" -f "$BASE/repo/server/docker-compose.yml" --env-file "$BASE/.env" "$@"; }

if [[ "${1:-}" == "update" ]]; then
  git -C "$BASE/repo" pull --ff-only
  compose pull umami db
  compose up -d --build
  docker image prune -f >/dev/null
  compose ps
  exit 0
fi
compose "$@"
