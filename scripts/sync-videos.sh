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
    name_noext="${basename%.*}"
    newname="${PREFIX}-${name_noext}.mp4"
    
    if [[ "$basename" == *.MOV ]] || [[ "$basename" == *.mov ]]; then
        echo "Converting: $basename -> $newname"
        ffmpeg -i "$f" -c:v libx264 -preset medium -crf 23 -c:a aac -movflags +faststart "$DST/$newname" -hide_banner -loglevel error
    else
        cp "$f" "$DST/$newname"
        echo "Copied: $basename -> $newname"
    fi
    count=$((count + 1))
done

if [ "$count" -eq 0 ]; then
    echo "No video files found in $SRC"
else
    echo "Done. $count file(s) in $DST/"
    echo "Next: add entry to assets/data/calendar.json"
fi
