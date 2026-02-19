# GPD Duo (G1622-01) Linux Fixes

Linux fixes and workarounds for the **GPD Duo (G1622-01)** running Debian (Trixie) with GNOME on Wayland.

The GPD Duo has dual built-in 2880x1800 displays, which presents some unique challenges on Linux. This repo documents the workarounds I've found.

## Hardware

- **Device:** GPD Duo (G1622-01)
- **Displays:** Dual 2880x1800 (DP-3: Stargate Technology panel, eDP-1: Samsung SDC panel)
- **WiFi:** Intel AX210
- **Webcam:** Integrated Camera (USB ID `2ef4:5820`)
- **Touchpad:** SP3105FT (I2C, 97x56mm)

## Fixes

| Issue | Solution |
|-------|----------|
| [Display Scaling](display-scaling.md) | Mutter fractional scaling via `gdbus` for dual 2880x1800 screens |
| [Webcam Disconnect Loop](webcam-fix/) | Disable rfkill input handler + USB rescan via systemd service |
| [DDC Brightness Control](ddc-brightness/) | GNOME Shell extension for DP-3 brightness via DDC/CI |
| [Touchpad Speed](touchpad.md) | `gsettings` tweak for the small SP3105FT touchpad |

## Tested On

- Debian Trixie (testing)
- GNOME 48 on Wayland
- Linux 6.12

## Contributing

If you have a GPD Duo and have found other fixes or improvements, issues and PRs are welcome.
