#!/bin/sh
# Per-user Chrome launcher that flips the GPD Duo webcam image (the sensor is mounted upside down).
# libv4l's LIBV4LCONTROL_FLAGS: 1 = horizontal flip, 2 = vertical flip, 3 = both (180°).
set -e
SRC=/usr/share/applications/google-chrome.desktop
DST="$HOME/.local/share/applications/google-chrome.desktop"
LIB=/usr/lib/x86_64-linux-gnu/libv4l/v4l2convert.so
FLAGS="${1:-2}"

[ -e "$SRC" ] || { echo "missing $SRC (is google-chrome-stable installed?)" >&2; exit 1; }
[ -e "$LIB" ] || { echo "missing $LIB (sudo apt install libv4l-0t64)" >&2; exit 1; }

mkdir -p "$(dirname "$DST")"
sed -E "s#^Exec=/usr/bin/google-chrome-stable#Exec=env LD_PRELOAD=$LIB LIBV4LCONTROL_FLAGS=$FLAGS /usr/bin/google-chrome-stable#" \
	"$SRC" >"$DST"
update-desktop-database "$(dirname "$DST")" 2>/dev/null || true
echo "Wrote $DST (LIBV4LCONTROL_FLAGS=$FLAGS). Quit Chrome completely, then start it from the dock."
