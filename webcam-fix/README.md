# Webcam

The integrated camera (USB ID `2ef4:5820`, 5 MP, in the hinge above the lower screen) has two
separate problems on Linux.

## 1. It only exists while the lower screen is on

**The camera gets its power together with the lower panel (`eDP-1`).** When that screen is off, the
camera drops off the USB bus completely. `lsusb` doesn't list it, there's no `/dev/video*`, and its
port reads `not attached`.

That is why it looks so unreliable. Suppose you use only the upper screen (`DP-3`) and GNOME's saved
layout turns the lower one off. Then every boot and every resume goes like this:

1. The firmware powers both panels, and the camera appears.
2. A few seconds later GNOME applies the saved layout and switches the lower panel off.
3. The camera disappears again.

In the kernel log every `usb 3-4: USB disconnect` lines up to the second with GNOME's
`Monitor 'Built-in display' has no configuration which is-current!` message.

**What works:** switch to the lower screen before a call. With **Fn+F3** (upper screen off, lower on), the
camera shows up about a second later. Chrome picks it up even if it was already running. If a page
doesn't see it, reload the page.

### What the earlier version of this fix got wrong

The previous version of this directory blamed the rfkill input handler and USB autosuspend. It
shipped a service that re-authorized USB bus 3 at boot, plus a udev rule. I've removed both:

- **`/proc/sys/kernel/rfkill_input` doesn't exist** on current kernels, so that step was a no-op.
- **Re-authorizing the bus can't prevent the drop.** The service runs at boot, before GNOME switches
  the lower panel off, so it can't stop the camera disappearing afterwards. It also briefly drops the
  fingerprint reader, Bluetooth and the upper screen's touch controller, which share that bus.
- **Autosuspend isn't the trigger.** The disconnects match the moment the lower panel turns off, to the
  second, not an idle timeout.

## 2. The image is upside down

The sensor is mounted **vertically flipped**: upside down, but not mirrored. The camera has no flip
controls of its own: `v4l2-ctl -d /dev/video0 --list-ctrls` shows only brightness, contrast,
exposure, etc. So the flip has to happen in software.

libv4l can do it for any program that's started with its `v4l2convert.so` preloaded.
`LIBV4LCONTROL_FLAGS` chooses the transform:

| Flags | Result |
|-------|--------|
| `1` | horizontal flip |
| `2` | **vertical flip ← correct for the Duo** |
| `3` | both (180° rotation). This one comes out mirrored on the Duo. |

### Chrome

`install-chrome-flip.sh` writes a per-user copy of Chrome's launcher that does this. No root needed:

```bash
./install-chrome-flip.sh
```

It creates `~/.local/share/applications/google-chrome.desktop`, which overrides the system launcher.
Every `Exec=` line is prefixed with
`env LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libv4l/v4l2convert.so LIBV4LCONTROL_FLAGS=2`.

Then **quit Chrome completely** (menu → Exit), and start it again from the dock. `chrome://restart` keeps
the old environment and won't pick it up.

Notes:

- **It only affects Chrome started from the launcher.** Chrome started from a terminal, Firefox,
  GNOME Snapshot and other PipeWire-based apps aren't covered.
- **It costs some CPU.** libv4l decodes the camera's MJPEG frames in software to flip them, which
  adds a little CPU load during calls.
- **To undo:** `rm ~/.local/share/applications/google-chrome.desktop`

To test without touching your normal profile, open the
[WebRTC getUserMedia sample](https://webrtc.github.io/samples/src/content/getusermedia/gum/) in a
throwaway instance. Hold up some text: it should read normally.

```bash
LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libv4l/v4l2convert.so LIBV4LCONTROL_FLAGS=2 \
  google-chrome --user-data-dir=/tmp/chrome-fliptest \
  https://webrtc.github.io/samples/src/content/getusermedia/gum/
```
