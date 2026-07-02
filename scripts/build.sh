#!/usr/bin/env bash
set -euo pipefail

PREMID_REPO="https://github.com/PreMiD/Activities.git"
ACTIVITIES=("AniTube" "UAKino")

usage() {
  cat <<'EOF'
Usage:
  ./scripts/build.sh [AniTube] [UAKino]

Examples:
  ./scripts/build.sh
  ./scripts/build.sh AniTube
  ./scripts/build.sh UAKino
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "$#" -gt 0 ]]; then
  ACTIVITIES=("$@")
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
UPSTREAM="$ROOT/PreMiD-Activities"
DIST="$ROOT/dist"

mkdir -p "$DIST"

run() {
  echo "-> $*"
  "$@"
}

if [[ ! -d "$UPSTREAM" ]]; then
  run git clone --depth 1 "$PREMID_REPO" "$UPSTREAM"
fi

if command -v npm >/dev/null 2>&1; then
  run npm install --ignore-scripts --prefix "$UPSTREAM"
  run npm install --prefix "$UPSTREAM/cli"
  run node "$UPSTREAM/node_modules/typescript/bin/tsc" -p "$UPSTREAM/cli"
elif command -v pnpm >/dev/null 2>&1; then
  (cd "$UPSTREAM" && run pnpm install --ignore-scripts --config.block-exotic-subdeps=false)
  (cd "$UPSTREAM/cli" && run pnpm install --ignore-scripts --config.block-exotic-subdeps=false)
  run node "$UPSTREAM/cli/node_modules/typescript/bin/tsc" -p "$UPSTREAM/cli"
else
  echo "Neither npm nor pnpm was found in PATH. Install Node.js/npm or pnpm and try again." >&2
  exit 1
fi

build_activity() {
  local activity="$1"
  local source=""
  local target=""
  local zip=""
  local out=""

  case "$activity" in
    AniTube)
      source="$ROOT/activities/anitube-premid"
      target="$UPSTREAM/websites/A/AniTube"
      zip="$target/dist/AniTube.zip"
      out="$DIST/AniTube.zip"
      ;;
    UAKino)
      source="$ROOT/activities/uakino-premid"
      target="$UPSTREAM/websites/U/UAKino"
      zip="$target/dist/UAKino.zip"
      out="$DIST/UAKino.zip"
      ;;
    *)
      echo "Unknown activity: $activity" >&2
      exit 1
      ;;
  esac

  mkdir -p "$target"
  cp "$source/metadata.json" "$source/presence.ts" "$source/iframe.ts" "$target/"

  (cd "$UPSTREAM" && run node "$UPSTREAM/cli/dist/index.js" build "$activity" --zip)
  cp "$zip" "$out"
  echo "Built: $out"
}

for activity in "${ACTIVITIES[@]}"; do
  build_activity "$activity"
done
