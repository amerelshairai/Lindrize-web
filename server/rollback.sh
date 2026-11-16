#!/usr/bin/env bash
# Go back to an earlier release of the website, from the server itself.
# The usual way to undo is on GitHub (see HOW-TO-EDIT.md). This is the backup method.
#
#   sudo -u deploy /srv/lindrize/repo/server/rollback.sh          go back one release
#   sudo -u deploy /srv/lindrize/repo/server/rollback.sh list     show the releases
#   sudo -u deploy /srv/lindrize/repo/server/rollback.sh <name>   go to that release
set -euo pipefail

SITE="${LINDRIZE_SITE_DIR:-/var/www/lindrize}"
ID='^[0-9]{8}-[0-9]{6}-[0-9a-f]{7}$'
cd "$SITE"

live="$(readlink current | sed 's#^releases/##')"
mapfile -t releases < <(ls -1 releases | grep -E "$ID" | sort -r)

if [[ "${1:-}" == "list" ]]; then
  for r in "${releases[@]}"; do [[ "$r" == "$live" ]] && echo "$r  (live)" || echo "$r"; done
  exit 0
fi

target="${1:-}"
if [[ -z "$target" ]]; then
  # The newest release that is older than the live one.
  for r in "${releases[@]}"; do
    if [[ "$r" < "$live" ]]; then target="$r"; break; fi
  done
  [[ -n "$target" ]] || { echo "There is no older release to go back to."; exit 1; }
fi

[[ "$target" =~ $ID && -f "releases/$target/index.html" ]] || { echo "No such release: $target"; exit 1; }
ln -sfn "releases/$target" current.new
mv -T current.new current
echo "The site now shows release $target (was $live)."
echo "Note: the next publish from GitHub will replace it with the newest version again."
