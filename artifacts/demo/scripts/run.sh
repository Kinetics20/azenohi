#!/usr/bin/env bash
set -euo pipefail
demo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../../.." && pwd)
cd "$demo_root"
demo_work="$demo_root/artifacts/demo/.work"
demo_tools="$demo_work/tools"
mkdir -p "$demo_work" "$demo_tools/debs" artifacts/demo/qa artifacts/demo/screenshots

# Use the repository's Node version; never replace system Node or project dependencies.
demo_node_version=$(tr -d 'v\n\r ' < .nvmrc)
if [[ -x /home/lipov/.local/share/azenohi-node/bin/node ]]; then
  export PATH="/home/lipov/.local/share/azenohi-node/bin:$PATH"
fi
if [[ $(node --version 2>/dev/null || true) != "v$demo_node_version" ]]; then
  if [[ ! -x "$demo_tools/node/bin/node" ]]; then
    curl --fail --location --output "$demo_work/node.tar.xz" "https://nodejs.org/dist/v${demo_node_version}/node-v${demo_node_version}-linux-x64.tar.xz"
    mkdir -p "$demo_tools/node"
    tar -xJf "$demo_work/node.tar.xz" --strip-components=1 -C "$demo_tools/node"
  fi
  export PATH="$demo_tools/node/bin:$PATH"
fi

# Ubuntu packages are extracted locally; no sudo and no system package changes.
if [[ ! -x "$demo_tools/root/usr/bin/ffmpeg" || ! -x "$demo_tools/root/usr/bin/openbox" ]]; then
  (
    cd "$demo_tools/debs"
    apt-get download ffmpeg xvfb libavdevice62 libavfilter11 xdotool libxdo3 openbox libobrender32 libobt2 libimlib2t64
    for package in ./*.deb; do dpkg-deb -x "$package" "$demo_tools/root"; done
  )
fi
export PATH="$demo_tools/root/usr/bin:$PATH"
export LD_LIBRARY_PATH="$demo_tools/root/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export XDG_DATA_DIRS="$demo_tools/root/usr/share:${XDG_DATA_DIRS:-/usr/local/share:/usr/share}"
export FFMPEG="$demo_tools/root/usr/bin/ffmpeg"
export FFPROBE="$demo_tools/root/usr/bin/ffprobe"
export XDOTOOL="$demo_tools/root/usr/bin/xdotool"

if [[ ! -x "$demo_tools/python/bin/python" ]]; then
  uv venv --python 3.12 "$demo_tools/python"
  uv pip install --python "$demo_tools/python/bin/python" -r artifacts/demo/scripts/requirements.txt
fi
demo_python="$demo_tools/python/bin/python"

if [[ ${1:-} == --render-only ]]; then
  "$demo_python" artifacts/demo/scripts/render.py
  "$demo_python" artifacts/demo/scripts/verify.py
  node artifacts/demo/scripts/playback.mjs
  exit
fi

npm --prefix web ci --no-audit --no-fund > artifacts/demo/qa/install.log 2>&1
npm --prefix web run check > artifacts/demo/qa/check.log 2>&1
npm --prefix web exec -- playwright install chromium > artifacts/demo/qa/browser-install.log 2>&1

# The recording services are private and are always cleaned up with this command.
demo_display_number=98
while [[ -e /tmp/.X11-unix/X$demo_display_number || -e /tmp/.X${demo_display_number}-lock ]]; do
  demo_display_number=$((demo_display_number + 1))
done
export DEMO_DISPLAY=:$demo_display_number
export DEMO_URL=http://127.0.0.1:4176
demo_pids=()
cleanup() { for pid in "${demo_pids[@]}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT
trap 'exit 130' INT TERM
Xvfb "$DEMO_DISPLAY" -screen 0 1920x1080x24 -ac -nolisten tcp -noreset > "$demo_work/xvfb.log" 2>&1 &
demo_pids+=("$!")
for attempt in {1..50}; do [[ -S /tmp/.X11-unix/X$demo_display_number ]] && break; sleep .1; done
DISPLAY="$DEMO_DISPLAY" openbox --config-file "$demo_tools/root/etc/xdg/openbox/rc.xml" > "$demo_work/openbox.log" 2>&1 &
demo_pids+=("$!")
node web/node_modules/vite/bin/vite.js preview web --host 127.0.0.1 --port 4176 --strictPort > "$demo_work/server.log" 2>&1 &
demo_server_pid=$!
demo_pids+=("$demo_server_pid")
sleep 1
kill -0 "$demo_server_pid" # Refuse to record another process's server if the port is busy.
for attempt in {1..100}; do curl -fsS "$DEMO_URL" >/dev/null && break; sleep .1; done
ffmpeg -hide_banner -loglevel error -f lavfi -i color=size=1920x1080:rate=60 -frames:v 2 -c:v h264_nvenc -f null -
node artifacts/demo/scripts/record.mjs "${@}" | tee "$demo_work/recording.log"
"$demo_python" artifacts/demo/scripts/render.py "${@}"
"$demo_python" artifacts/demo/scripts/verify.py "${@}"
node artifacts/demo/scripts/playback.mjs "${@}"
