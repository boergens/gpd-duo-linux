# Display Scaling

The GPD Duo's dual 2880x1800 displays need fractional scaling to be usable. GNOME's Settings UI may not expose all valid scale factors, but you can set them directly via `gdbus` on the Mutter DisplayConfig interface.

## Setting the Scale

First, get the current serial number (required for ApplyMonitorsConfig):

```bash
serial=$(gdbus call --session \
  --dest org.gnome.Mutter.DisplayConfig \
  --object-path /org/gnome/Mutter/DisplayConfig \
  --method org.gnome.Mutter.DisplayConfig.GetCurrentState \
  | grep -oP '^\(uint32 \K\d+')
```

Then apply the desired scale. Method `2` makes it persistent across reboots:

```bash
gdbus call --session \
  --dest org.gnome.Mutter.DisplayConfig \
  --object-path /org/gnome/Mutter/DisplayConfig \
  --method org.gnome.Mutter.DisplayConfig.ApplyMonitorsConfig \
  "$serial" 2 \
  "[(0, 0, 1.7475727796554565, uint32 0, true, [('DP-3', '2880x1800@60.001', {})])]" "{}"
```

Replace `1.7475727796554565` with your preferred scale factor.

## Valid Scale Factors

The following values are accepted by Mutter for these displays:

| Scale | Effective Resolution |
|-------|---------------------|
| 1.0 | 2880x1800 |
| 1.25 | 2304x1440 |
| 1.5 | 1920x1200 |
| **1.7475...** | **~1648x1030** |
| 2.0 | 1440x900 |
| 2.25 | 1280x800 |
| 2.5 | 1152x720 |

I use **1.7475727796554565** (~1.75x), which is a good balance for the 15.6" screens.

## Text Scaling

You can also increase GNOME's text scaling factor for additional readability:

```bash
gsettings set org.gnome.desktop.interface text-scaling-factor 1.25
```

This is equivalent to enabling "Large Text" in GNOME Accessibility settings.

## Note on xrandr

`xrandr` (via Xwayland) reports incorrect resolutions for these displays (e.g., 3296x2060). Use the Mutter `GetCurrentState` method above for accurate display information.
