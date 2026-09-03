#!/usr/bin/env bash
# Thin wrapper: load .env.loadtest into the environment, then run k6 with the
# given SCENARIO. k6 reads config from OS env vars (via __ENV), so we export
# the file before invoking it.
#
#   scripts/run.sh browse
#   scripts/run.sh all
#   SCENARIO passed as $1; any extra args are forwarded to `k6 run`.

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
envfile="$here/.env.loadtest"

if [[ ! -f "$envfile" ]]; then
  echo "Missing $envfile — copy .env.loadtest.example and fill it in." >&2
  exit 1
fi

if ! command -v k6 >/dev/null 2>&1; then
  echo "k6 is not installed. Install it: brew install k6  (see load-tests/README.md)" >&2
  exit 1
fi

scenario="${1:-browse}"
shift || true

set -a
# shellcheck disable=SC1090
source "$envfile"
set +a

mkdir -p "$here/results"
stamp="$(date +%Y%m%d-%H%M%S)"

exec k6 run \
  -e "SCENARIO=$scenario" \
  --summary-export "$here/results/${scenario}-${stamp}.summary.json" \
  "$@" \
  "$here/main.js"
