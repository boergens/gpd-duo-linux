# Touchpad Speed

> If your touchpad stops responding entirely, see [Touchpad Freezes](touchpad-freeze/).

The GPD Duo's touchpad (SP3105FT, 97x56mm) is quite small, and the default tracking speed in GNOME feels too fast for precise control.

## Fix

Reduce the touchpad speed via `gsettings`:

```bash
gsettings set org.gnome.desktop.peripherals.touchpad speed -0.4
```

This slows the pointer down for more accurate tracking on the small surface.

## Finding Your Preferred Speed

The speed value ranges from **-1.0** (slowest) to **1.0** (fastest), with **0.0** being the default. You can also adjust this in **GNOME Settings > Mouse & Touchpad > Touchpad Speed**.

A value around **-0.3 to -0.5** works well for the SP3105FT's small size.
