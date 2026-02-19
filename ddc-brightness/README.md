# DDC Brightness Control

The GPD Duo's DP-3 display (Stargate Technology panel) supports DDC/CI for brightness control, but GNOME doesn't expose a brightness slider for it by default. This GNOME Shell extension adds a brightness slider to the Quick Settings panel that controls the DP-3 display via `ddcutil`.

## Prerequisites

Install `ddcutil`:

```bash
sudo apt install ddcutil
```

## System Setup

### 1. Load the i2c-dev kernel module at boot

```bash
sudo cp i2c-dev.conf /etc/modules-load.d/
```

Or load it immediately:

```bash
sudo modprobe i2c-dev
```

### 2. Set permissions on i2c devices

Copy the udev rule so your user can access i2c devices without root:

```bash
sudo cp 99-i2c-ddcutil.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules
sudo udevadm trigger
```

Make sure your user is in the `video` group:

```bash
sudo usermod -aG video "$USER"
```

Log out and back in for the group change to take effect.

### 3. Find your DDC bus number

```bash
ddcutil detect
```

Look for the DP-3 display and note its I2C bus number. The extension defaults to bus **17** -- update `DDC_BUS` in `extension.js` if yours differs.

## Install the Extension

```bash
mkdir -p ~/.local/share/gnome-shell/extensions/ddc-brightness@gpd-duo
cp extension.js metadata.json ~/.local/share/gnome-shell/extensions/ddc-brightness@gpd-duo/
```

Then restart GNOME Shell:
- On Wayland: log out and log back in
- On X11: press Alt+F2, type `r`, press Enter

Enable the extension:

```bash
gnome-extensions enable ddc-brightness@gpd-duo
```

## How It Works

The extension adds a `QuickSlider` to GNOME's Quick Settings panel. It:

1. Reads the current brightness via `ddcutil getvcp 0x10` on startup
2. Debounces slider changes (300ms) to avoid flooding the I2C bus
3. Sets brightness via `ddcutil setvcp 0x10 <value>`

DDC/CI VCP code `0x10` is the standard brightness control.
