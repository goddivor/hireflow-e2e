#!/usr/bin/env bash
# Records the hiring journey test and turns its two browser videos into media/hiring-journey.gif:
# recruiter on the left, candidate on the right, on one shared clock.
# Needs the stack running (docker compose up -d --build --wait) and ffmpeg.
set -euo pipefail
cd "$(dirname "$0")/.."

E2E_VIDEO=on E2E_SLOWMO="${E2E_SLOWMO:-350}" npx playwright test e2e/tests/journeys --workers=1 --retries=0

dir=$(ls -d test-results/journeys-*/ | head -1)
recruiter=$(ls "$dir"video-1-recruiter/*.webm)
candidate=$(ls "$dir"video-2-guest/*.webm)
offset=$(node -e 'const s = require(process.argv[1]); console.log(((s["2-guest"] - s["1-recruiter"]) / 1000).toFixed(2))' "$(pwd)/${dir}video-starts.json")
font=$(fc-match -f '%{file}' "DejaVu Sans:bold")

# A title bar above each video, so the label never hides the page.
label() { echo "pad=iw:ih+44:0:44:color=0x1c1c21,drawtext=fontfile=$font:text='$1':x=(w-text_w)/2:y=11:fontsize=22:fontcolor=white"; }

mkdir -p media
ffmpeg -y -loglevel error -i "$recruiter" -i "$candidate" -filter_complex "
  [0:v]scale=800:-2,tpad=stop_mode=clone:stop_duration=2.5,$(label 'Recruiter')[left];
  [1:v]scale=800:-2,tpad=start_duration=${offset}:color=0xf4f4f6:stop_mode=clone:stop_duration=2.5,$(label 'Candidate (Chrome fake camera and microphone)')[right];
  [left][right]hstack=inputs=2,fps=8,split[a][b];
  [a]palettegen=max_colors=128:stats_mode=diff[palette];
  [b][palette]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle
" media/hiring-journey.gif

echo "media/hiring-journey.gif: $(du -h media/hiring-journey.gif | cut -f1)"
