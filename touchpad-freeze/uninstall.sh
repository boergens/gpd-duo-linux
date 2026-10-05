#!/bin/sh
# Remove the DSDT override and rebuild every initramfs without it.
set -e
rm -f /etc/initramfs-tools/hooks/gpd-duo-touchpad-acpi /etc/initramfs-tools/acpi-override/dsdt.aml
rmdir --ignore-fail-on-non-empty /etc/initramfs-tools/acpi-override 2>/dev/null || true
update-initramfs -u -k all
