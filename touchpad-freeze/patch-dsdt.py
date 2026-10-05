#!/usr/bin/env python3
"""Patch the GPD Duo (G1622-01, BIOS 2.17) DSDT so the SP3105FT touchpad IRQ is level-triggered.

The stock \\_SB.I2CA.TPD0._CRS declares GpioInt(Level, ActiveLow, ...) and then, in the
branch for the SP3105FT, overrides it with `GTRG = One` (the _MOD bit -> Edge). I2C-HID
devices hold INT low until the host reads the report, so a single missed edge leaves the
touchpad dead until it is reset. This flips that one Store(One, GTRG) to Store(Zero, GTRG),
bumps the OEM revision (so the override is accepted) and fixes the checksum.

Usage: patch-dsdt.py <stock dsdt.dat> <out.aml>
"""
import struct
import sys

HID_THEN_GTRG = b'\x70\x0dSP3105FT\x00_HID' + b'\x70\x01GTRG'  # Store("SP3105FT",_HID); Store(One,GTRG)

src, dst = sys.argv[1], sys.argv[2]
d = bytearray(open(src, 'rb').read())

assert d[:4] == b'DSDT', 'not a DSDT'
assert struct.unpack_from('<I', d, 4)[0] == len(d), 'length mismatch'
assert sum(d) & 0xff == 0, 'stock checksum invalid'
assert d.count(HID_THEN_GTRG) == 1, 'expected exactly one SP3105FT GTRG store; firmware differs'

off = d.index(HID_THEN_GTRG) + len(HID_THEN_GTRG) - len(b'\x01GTRG')
assert d[off] == 0x01
d[off] = 0x00  # OneOp -> ZeroOp

oemrev = struct.unpack_from('<I', d, 24)[0]
struct.pack_into('<I', d, 24, oemrev + 1)

d[9] = 0
d[9] = (-sum(d)) & 0xff
assert sum(d) & 0xff == 0

open(dst, 'wb').write(d)
print(f'patched byte at 0x{off:x}; OEM revision 0x{oemrev:x} -> 0x{oemrev + 1:x}; wrote {dst}')
