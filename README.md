# GPD Duo (G1622-01) Linux Fixes

Linux fixes and workarounds for the **GPD Duo (G1622-01)** running Debian (Trixie) with GNOME on Wayland.

The GPD Duo has dual built-in 2880x1800 displays, which presents some unique challenges on Linux. This repo documents the workarounds I've found.

## Hardware

- **Device:** GPD Duo (G1622-01)
- **Displays:** Dual 2880x1800 (DP-3: Stargate Technology panel, eDP-1: Samsung SDC panel)
- **WiFi:** Intel AX210
- **Webcam:** Integrated Camera (USB ID `2ef4:5820`), in the hinge above the lower screen, powered with the lower panel
- **Touchpad:** SP3105FT (I2C, 97x56mm), HID ID `0911:5288` = Hantick 5288
- **BIOS:** 2.17 (03/26/2025)

## Fixes

| Issue | Solution |
|-------|----------|
| [Display Scaling](display-scaling.md) | Mutter fractional scaling via `gdbus` for dual 2880x1800 screens |
| [Webcam Missing / Upside Down](webcam-fix/) | Camera is only powered while the lower screen is on; vertical flip for Chrome via libv4l |
| [DDC Brightness Control](ddc-brightness/) | GNOME Shell extension for DP-3 brightness via DDC/CI |
| [Touchpad Speed](touchpad.md) | `gsettings` tweak for the small SP3105FT touchpad |
| [Touchpad Freezes](touchpad-freeze/) | **Not solved yet.** Investigation notes, quick recovery, and a DSDT fix for an edge-triggered IRQ |

## Tested On

- Debian 13 (Trixie)
- GNOME 48 on Wayland
- Linux 6.12 (6.12.107)

## Contributing

If you have a GPD Duo and have found other fixes or improvements, issues and PRs are welcome.
