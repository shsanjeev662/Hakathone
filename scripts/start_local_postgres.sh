#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/sanjeev/Hakathone"
PG_BIN="/usr/lib/postgresql/16/bin"
DATA_DIR="$ROOT_DIR/.postgres-data"
LOG_FILE="$DATA_DIR/postgres.log"

mkdir -p "$ROOT_DIR/.postgres-run"

if [ ! -d "$DATA_DIR" ]; then
  "$PG_BIN/initdb" -D "$DATA_DIR"
fi

"$PG_BIN/pg_ctl" \
  -D "$DATA_DIR" \
  -l "$LOG_FILE" \
  -o "-c listen_addresses='' -k /tmp" \
  start
