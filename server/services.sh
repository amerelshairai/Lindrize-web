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

# Launch mode sends every visit to lindrize.online. Refuse it until lindrize.online points to this
# server (the same address as the test address), or the whole site would be unreachable.
# Emergency override: LINDRIZE_FORCE=1 before the command.
if [[ ${#files[@]} -gt 2 && ( "${1:-}" == up || "${1:-}" == update ) && "${LINDRIZE_FORCE:-}" != 1 ]]; then
  main="$( (dig +short lindrize.online A @1.1.1.1 || true) | sort | tr '\n' ' ')"
  test="$( (dig +short new.lindrize.online A @1.1.1.1 || true) | sort | tr '\n' ' ')"
  if [[ -z "$test" || "$main" != "$test" ]]; then
    echo "Stopped: LINDRIZE_STAGE=live, but lindrize.online does not point to this server yet."
    echo "  lindrize.online     -> ${main:-nothing}"
    echo "  new.lindrize.online -> ${test:-nothing}"
    echo "Change the DNS first (docs/DNS-MOVE.md), or switch back:"
    echo "  sudo sed -i 's/^LINDRIZE_STAGE=.*/LINDRIZE_STAGE=preview/' /srv/lindrize/.env && sudo $0 up -d"
    exit 1
  fi
fi

if [[ "${1:-}" == "update" ]]; then
  git -C "$BASE/repo" pull --ff-only
  compose pull web umami db
  compose up -d --build
  docker image prune -f >/dev/null
  compose ps
  exit 0
fi
compose "$@"
