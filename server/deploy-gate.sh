#!/usr/bin/env bash
# The only thing the publishing key from GitHub is allowed to run on this server.
# Installed as /usr/local/bin/lindrize-deploy-gate and named in the deploy user's
# authorized_keys file, so the key cannot open a shell or run anything else.
#
# It accepts exactly three requests:
#   1. rsync uploading one new release folder
#   2. activate <release>   switch the site to that release, keep the newest 5
#   3. list                 show the releases and which one is live
set -euo pipefail

SITE="${LINDRIZE_SITE_DIR:-/var/www/lindrize}"
KEEP=5
ID='[0-9]{8}-[0-9]{6}-[0-9a-f]{7}'
request="${SSH_ORIGINAL_COMMAND:-}"

refuse() {
  echo "lindrize-deploy-gate: refused" >&2
  exit 1
}

live() { readlink "$SITE/current" 2>/dev/null | sed 's#^releases/##' || true; }

if [[ "$request" =~ ^rsync\ --server\ -[a-zA-Z]+e\.[a-zA-Z]+(\ --delete)?\ \.\ releases/($ID)/$ ]]; then
  # Upload only: "--sender" (reading files back) never matches the pattern above.
  cd "$SITE"
  mkdir -p releases
  # shellcheck disable=SC2086  # the pattern above allows only safe characters
  exec $request
fi

if [[ "$request" =~ ^activate\ ($ID)$ ]]; then
  release="${BASH_REMATCH[1]}"
  cd "$SITE"
  [[ -f "releases/$release/index.html" && -f "releases/$release/ar/index.html" ]] || {
    echo "Release $release is missing or incomplete. Nothing was changed." >&2
    exit 1
  }
  # Make the new link beside the old one, then swap in a single step: visitors never see a gap.
  ln -sfn "releases/$release" current.new
  mv -T current.new current
  echo "Live: $release"
  # Keep the newest releases and never the one that is live.
  ls -1 releases | grep -E "^$ID$" | sort -r | tail -n +$((KEEP + 1)) | while read -r old; do
    [[ "$old" == "$release" ]] || rm -rf -- "releases/$old"
  done
  exit 0
fi

if [[ "$request" == "list" ]]; then
  now="$(live)"
  ls -1 "$SITE/releases" 2>/dev/null | grep -E "^$ID$" | sort -r | while read -r r; do
    [[ "$r" == "$now" ]] && echo "$r  (live)" || echo "$r"
  done
  exit 0
fi

refuse
