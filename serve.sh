#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

PORT="${1:-8000}"

echo "backend-log viewer: http://localhost:$PORT"
python3 -m http.server "$PORT"
