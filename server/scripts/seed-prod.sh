#!/usr/bin/env bash
set -euo pipefail
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm \
  -v ./server/JSON_files:/app/JSON_files:ro \
  server node dist/db/seed.js
