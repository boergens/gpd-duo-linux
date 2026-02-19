# Webcam Fix

The GPD Duo's integrated camera (USB ID `2ef4:5820`) disconnects in a loop shortly after boot. The kernel's rfkill input handler misinterprets ACPI events, causing repeated USB disconnects.

## Symptoms

- `dmesg` shows repeated USB disconnect/reconnect messages for the webcam
- Camera is unavailable or drops out of video calls
- Device cycles on USB bus 3

## Fix

The fix has two parts:

1. **Disable the rfkill input handler** and **rescan USB bus 3** at boot (systemd service)
2. **Disable USB autosuspend** for the webcam (udev rule)

## Installation

Copy the systemd service:

```bash
sudo cp fix-webcam.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable fix-webcam.service
```

Copy the udev rule:

```bash
sudo cp 99-webcam-no-autosuspend.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules
```

Reboot (or run the service manually):

```bash
sudo systemctl start fix-webcam.service
```

## How It Works

The systemd service (`fix-webcam.service`) runs at boot and:

1. Disables the rfkill input handler (`/proc/sys/kernel/rfkill_input`)
2. De-authorizes and re-authorizes USB bus 3, forcing a clean re-enumeration

The udev rule prevents the kernel from putting the webcam into USB autosuspend, which can trigger the same disconnect issue.
