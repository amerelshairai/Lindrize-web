#!/usr/bin/env bash
# Tests the publish gate and the undo script without a server: a stand-in for SSH hands the
# request to the gate exactly as the real SSH service would.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
export LINDRIZE_SITE_DIR="$work/site"
mkdir -p "$LINDRIZE_SITE_DIR/releases" "$work/dist/ar"
echo home > "$work/dist/index.html"; echo ar > "$work/dist/ar/index.html"

cat > "$work/ssh" <<FAKE
#!/usr/bin/env bash
shift   # the server name
SSH_ORIGINAL_COMMAND="\$*" exec "$here/../deploy-gate.sh"
FAKE
chmod +x "$work/ssh"
fail() { echo "✗ $1"; exit 1; }
gate() { SSH_ORIGINAL_COMMAND="$1" "$here/../deploy-gate.sh"; }

ids=()
for n in 1 2 3 4 5 6 7; do
  id="2026111$n-120000-abcdef$n"; ids+=("$id")
  echo "v$n" > "$work/dist/version.txt"
  rsync -rlt --delete -e "$work/ssh" "$work/dist/" "server:releases/$id/" || fail "upload $n"
  gate "activate $id" >/dev/null || fail "activate $n"
done
[[ "$(cat "$LINDRIZE_SITE_DIR/current/version.txt")" == v7 ]] || fail "newest release is not live"
[[ "$(ls "$LINDRIZE_SITE_DIR/releases" | wc -l)" == 5 ]] || fail "should keep exactly 5 releases"
[[ "$(readlink "$LINDRIZE_SITE_DIR/current")" == "releases/${ids[6]}" ]] || fail "link must be relative"
gate list | grep -q "${ids[6]}  (live)" || fail "list"

# Everything else is refused.
for bad in "" "bash" "cat /etc/passwd" "activate ../../etc" "activate ${ids[6]}; id" \
  "rsync --server --sender -logDtpre.iLsfxCIvu . releases/${ids[6]}/" \
  "rsync --server -logDtpre.iLsfxCIvu . /etc/" \
  "rsync --server -logDtpre.iLsfxCIvu --log-file=/tmp/x . releases/${ids[6]}/" \
  "rsync --server -logDtpre.iLsfxCIvu . releases/../../x/"; do
  if gate "$bad" >/dev/null 2>&1; then fail "should refuse: $bad"; fi
done
# Reading files back through rsync is refused too.
if rsync -rlt -e "$work/ssh" "server:releases/${ids[6]}/" "$work/stolen/" 2>/dev/null; then fail "download should be refused"; fi
# An incomplete release is never made live.
mkdir -p "$LINDRIZE_SITE_DIR/releases/20270101-000000-0000000"
if gate "activate 20270101-000000-0000000" >/dev/null 2>&1; then fail "incomplete release went live"; fi
rmdir "$LINDRIZE_SITE_DIR/releases/20270101-000000-0000000"

# Undo: one step back, then to a named release.
"$here/../rollback.sh" >/dev/null
[[ "$(cat "$LINDRIZE_SITE_DIR/current/version.txt")" == v6 ]] || fail "rollback one step"
"$here/../rollback.sh" "${ids[3]}" >/dev/null
[[ "$(cat "$LINDRIZE_SITE_DIR/current/version.txt")" == v4 ]] || fail "rollback to a named release"
if "$here/../rollback.sh" "nope" >/dev/null 2>&1; then fail "unknown release accepted"; fi
echo "✓ Publish gate and undo script behave as designed"
