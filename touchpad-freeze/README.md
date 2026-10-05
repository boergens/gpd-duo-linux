# Touchpad Freezes

**Status: not solved yet.** These are my notes so far, plus one firmware fix that is correct but
turned out not to be the cure.

## Symptom

Every now and then the touchpad stops responding, in the middle of a normal session. The pointer
doesn't move and taps do nothing. The keyboard and the touchscreens keep working. It stays dead until
the driver is reloaded or the machine is rebooted. Nothing is logged in `dmesg` when it happens.

## Quick recovery

Reloading the driver brings the touchpad back within a second, no reboot needed:

```bash
echo i2c-SP3105FT:00 | sudo tee /sys/bus/i2c/drivers/i2c_hid_acpi/unbind
echo i2c-SP3105FT:00 | sudo tee /sys/bus/i2c/drivers/i2c_hid_acpi/bind
```

## The hardware

- ACPI device `\_SB.I2CA.TPD0`, enumerated as `SP3105FT:00`, HID ID `0911:5288`
- `0911:5288` is the **Hantick 5288** controller. It's the same chip as the `HTIX5288` touchpad in the GPD
  Win Max, and the kernel already carries an i2c-hid quirk entry for it.
- Driver stack: `i2c_hid_acpi` → `hid-multitouch`, on the AMD DesignWare I2C controller `AMDI0010:00`
- Interrupt: AMD GPIO pin 90

## What a freeze looks like from the inside

I caught one with the touchpad still frozen:

- **No interrupts at all** from the touchpad while a finger moves on it. Compare the
  `SP3105FT` line in `/proc/interrupts` before and after touching the pad.
- **The interrupt line is idle.** `/sys/kernel/debug/gpio` shows pin `#90` as `input ↑`, i.e. high,
  and the line is active-low. So the touchpad isn't sitting on unread data. It has simply gone quiet.
- **No errors** from `i2c_hid`, `i2c_designware` or `hid-multitouch`.
- Unbind and bind brings it straight back.

So the chip itself stops reporting. It isn't a lost interrupt on the computer's side.

## Firmware bug: edge-triggered interrupt (fixed, but not the cause)

The DSDT declares the touchpad interrupt correctly as `GpioInt(Level, ActiveLow, …)`. Then `_CRS`
overrides it in the branch for this touchpad model:

```
If (Ones)
{
    _HID = "SP3105FT"
    GTRG = One          // _MOD bit -> Edge-triggered
}
```

I2C-HID devices hold their interrupt line low until the host reads the report, so they should be
level-triggered. The touchscreen right next to it (`GXTP7380`) is level-triggered.

This directory contains a fix. It's an early-boot ACPI table override that changes that one store to
`GTRG = Zero`. It works: the interrupt reports `level` and there's no interrupt storm. **It did not
stop the freezes**, though. The frozen state above has the line idle, which an edge/level mix-up
wouldn't produce. I keep it installed because it's what the I2C-HID spec expects, and it removes one
way the touchpad *could* hang.

### Installing the override (BIOS 2.17 only)

Requires `acpica-tools` (`sudo apt install acpica-tools`). The kernel must have `CONFIG_ACPI_TABLE_UPGRADE=y`,
which Debian's kernel does.

```bash
cd touchpad-freeze
sudo acpidump > acpi.dat           # dump your own firmware tables
acpixtract -a acpi.dat             # -> dsdt.dat (plus ssdt*.dat)
./patch-dsdt.py dsdt.dat dsdt.aml  # flips GTRG One -> Zero, bumps OEM revision, fixes checksum
sudo ./install.sh                  # current kernel only; older kernels stay stock as a fallback
```

`patch-dsdt.py` refuses to write anything unless it finds exactly the expected bytes. The
initramfs hook `gpd-duo-touchpad-acpi` only adds the override if DMI says `G1622-01`, BIOS `2.17`,
`03/26/2025`, *and* the live DSDT is either the known stock table or the patched one.

**After reboot, verify:**

```bash
for i in /sys/kernel/irq/*; do grep -qs SP3105FT $i/actions && cat $i/type; done   # -> level
sudo dmesg | grep -i 'table upgrade'   # ACPI: Table Upgrade: override [DSDT-ALASKA-A M I ]
```

**Remove:** `sudo ./uninstall.sh`

**BIOS updates:** the kernel replaces any DSDT whose OEM IDs match, regardless of version. An
initramfs built *before* a BIOS update still carries the old patched table. After flashing a new BIOS,
run `sudo update-initramfs -u -k all` (the hook will then skip it), and check whether the new
firmware still has `GTRG = One`.

## Current suspect: very short suspend/resume cycles

The Hantick 5288 has a history of this. The 2018 kernel patch [*HID: i2c-hid: disable runtime PM
operations on hantick touchpad*](https://lkml.iu.edu/hypermail/linux/kernel/1810.1/01354.html) says
the touchpad "can quickly fall into a wrong state if there are too many open/close operations, which
will either make it stop reporting any input, or will shift all the input reads by a few bytes". Back
then the trigger was runtime PM. Current kernels don't runtime-suspend it any more. The touchpad
now only gets put to sleep and woken up again on **system suspend/resume**.

That turns out to happen far more often than it feels like on this machine. Over about a week of
logs:

- **Around 20 suspends lasted 0–2 seconds.** GNOME's idle timer suspends the machine, and a touch or
  key press wakes it right back up. All you see is a flicker.
- **Three times, libinput logged a tap that was in flight at the moment of suspend.** That's the
  `timer event8 tap: scheduled expiry is in the past` message. In other words, the touchpad was
  being touched right as it was told to sleep.
- **The lid sensor flaps.** The kernel warns `The lid device is not compliant to SW_LID`, and once it
  caused five 1-second suspends within two minutes.

So a freeze that feels random might come right after one of these blink-suspends. This isn't
confirmed yet: I don't know the exact time each freeze started.

**Possible workaround (not yet tested):** a `systemd-sleep` hook that reloads the touchpad driver after
every resume, the same as the quick recovery above.

## Unrelated, but seen on the same touchpad

libinput logs `kernel bug: Touch jump detected and discarded` for this touchpad. A July 2026
upstream patch, [*HID: multitouch: reclassify HTIX5288*](https://ratatoskr.run/linux-input/2026/07/17246284/t),
moves `0911:5288` to `MT_CLS_WIN_8_FORCE_MULTI_INPUT_NSMU`. It fixes a lifted finger's stale
coordinates overwriting the remaining one after a two-finger scroll, where the pointer looks stuck at
the lift position. Linux 6.12 doesn't have it. That's a different bug from the freeze above: there,
the touchpad keeps sending data.

## Diagnosing a freeze yourself

```bash
# 1. Does the touchpad still raise interrupts? Run this, move a finger, run it again.
grep SP3105FT /proc/interrupts

# 2. Interrupt line state (root): "input ↑" = idle, "input ↓" = asserted with data waiting
sudo grep '#90' /sys/kernel/debug/gpio

# 3. Recent suspend/resume cycles and what triggered them
journalctl -b -o short-iso | grep -E 'PM: suspend (entry|exit)|will suspend now|Suspending|Lid (opened|closed)'
```
