#!/usr/bin/env bash
# Records the hiring journey test and turns its two browser videos into two GIFs:
# media/recruiter.gif (the recruiter's active moments) and media/candidate.gif.
# Needs the stack running (docker compose up -d --build --wait) and ffmpeg.
set -euo pipefail
cd "$(dirname "$0")/.."

E2E_VIDEO=on E2E_SLOWMO="${E2E_SLOWMO:-350}" npx playwright test e2e/tests/journeys --workers=1 --retries=0

dir=$(ls -d test-results/journeys-*/ | head -1)
recruiter=$(ls "$dir"video-1-recruiter/*.webm)
candidate=$(ls "$dir"video-2-guest/*.webm)
# The candidate's browser opens when the recruiter is done inviting; the recruiter only waits after that.
invite_done=$(node -e 'const s = require(process.argv[1]); console.log(((s["2-guest"] - s["1-recruiter"]) / 1000).toFixed(2))' "$(pwd)/${dir}video-starts.json")
recruiter_length=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$recruiter")
last_check=$(node -e 'console.log(Math.max(0, process.argv[1] - 2.5).toFixed(2))' "$recruiter_length")

palette="fps=8,scale=960:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle"
hold="tpad=stop_mode=clone:stop_duration=2.5"

mkdir -p media
ffmpeg -y -loglevel error -i "$recruiter" -filter_complex "
  [0:v]trim=0:${invite_done},setpts=PTS-STARTPTS[invite];
  [0:v]trim=${last_check},setpts=PTS-STARTPTS[check];
  [invite][check]concat=n=2:v=1,${hold},${palette}
" media/recruiter.gif
ffmpeg -y -loglevel error -i "$candidate" -filter_complex "[0:v]${hold},${palette}" media/candidate.gif

du -h media/recruiter.gif media/candidate.gif
