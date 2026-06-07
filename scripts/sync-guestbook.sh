#!/bin/bash
# Sync guestbook entries from Cloudflare Worker KV into the repo
# so they load from a same-origin JSON file (bypasses ad-blockers that block *.workers.dev)
set -euo pipefail

API="https://guestbook-api.clovehitch.workers.dev/entries"
OUT="assets/data/guestbook.json"

echo "Fetching entries from $API ..."
curl -s "$API" -o "$OUT"
echo "Wrote $(wc -c < "$OUT") bytes to $OUT"
