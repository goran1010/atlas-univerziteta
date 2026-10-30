#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm \
  -v "$PWD/server/JSON_files:/app/JSON_files:ro" \
  server node dist/db/seed.js
