#!/bin/bash
# Sync video from Paddy's iCloud Photos folder into assets/videos/
# Usage: ./scripts/sync-videos.sh [date-prefix]
#   date-prefix: optional YYYY-MM-DD prefix (default: today's date)
# Example: ./scripts/sync-videos.sh 2026-06-07

SRC="$HOME/Downloads/iCloud Photos from Paddy Greene"
DST="assets/videos"
PREFIX="${1:-$(date +%Y-%m-%d)}"

if [ ! -d "$SRC" ]; then
    echo "Source directory not found: $SRC"
    exit 1
fi

mkdir -p "$DST"

count=0
for f in "$SRC"/*.{MOV,mov,MP4,mp4,webm}; do
    [ -f "$f" ] || continue
    basename=$(basename "$f")
    newname="${PREFIX}-${basename}"
    cp "$f" "$DST/$newname"
    echo "Copied: $basename -> $newname"
    count=$((count + 1))
done

if [ "$count" -eq 0 ]; then
    echo "No video files found in $SRC"
else
    echo "Done. Copied $count file(s) to $DST/"
    echo "Next: add an entry to assets/data/calendar.json"
fi
