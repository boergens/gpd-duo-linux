#!/bin/sh
# Install the SP3105FT level-IRQ DSDT override into the running kernel's initramfs only,
# so the older kernel in GRUB's "Advanced options" stays stock as a fallback.
set -e
cd "$(dirname "$0")"
install -D -m 0644 dsdt.aml /etc/initramfs-tools/acpi-override/dsdt.aml
install -D -m 0755 gpd-duo-touchpad-acpi /etc/initramfs-tools/hooks/gpd-duo-touchpad-acpi
update-initramfs -u -k "$(uname -r)"
echo "--- early cpio check:"
lsinitramfs "/boot/initrd.img-$(uname -r)" | grep 'kernel/firmware/acpi' || { echo "override NOT in initramfs" >&2; exit 1; }
