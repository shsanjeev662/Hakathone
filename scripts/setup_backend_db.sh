#!/usr/bin/env bash
set -euo pipefail

cd /home/sanjeev/Hakathone/backend

createdb -h /tmp dhukuti_db 2>/dev/null || true
npm run db:setup
