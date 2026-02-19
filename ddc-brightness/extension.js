import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';

const DDC_BUS = 17;
const DDC_VCP_BRIGHTNESS = '0x10';
const DEBOUNCE_MS = 300;

const BrightnessSlider = GObject.registerClass(
class BrightnessSlider extends QuickSettings.QuickSlider {
    _init() {
        super._init({
            iconName: 'display-brightness-symbolic',
        });

        this._debounceId = 0;

        this.slider.connect('notify::value', () => {
            this._onSliderChanged();
        });

        this._readBrightness();
    }

    _onSliderChanged() {
        if (this._debounceId)
            GLib.source_remove(this._debounceId);

        this._debounceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, DEBOUNCE_MS, () => {
            this._debounceId = 0;
            const percent = Math.round(this.slider.value * 100);
            this._setBrightness(percent);
            return GLib.SOURCE_REMOVE;
        });
    }

    _setBrightness(percent) {
        try {
            const proc = Gio.Subprocess.new(
                ['ddcutil', '--bus', DDC_BUS.toString(), 'setvcp', DDC_VCP_BRIGHTNESS, percent.toString()],
                Gio.SubprocessFlags.NONE
            );
            proc.wait_async(null, (p, res) => {
                try {
                    p.wait_finish(res);
                } catch (e) {
                    logError(e, 'ddc-brightness: setvcp failed');
                }
            });
        } catch (e) {
            logError(e, 'ddc-brightness: failed to spawn ddcutil');
        }
    }

    _readBrightness() {
        try {
            const proc = Gio.Subprocess.new(
                ['ddcutil', '--bus', DDC_BUS.toString(), 'getvcp', DDC_VCP_BRIGHTNESS],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );
            proc.communicate_utf8_async(null, null, (p, res) => {
                try {
                    const [, stdout] = p.communicate_utf8_finish(res);
                    // Output like: "VCP code 0x10 (Brightness): current value = 50, max value = 100"
                    const match = stdout.match(/current value\s*=\s*(\d+)/);
                    if (match) {
                        const value = parseInt(match[1], 10);
                        this.slider.value = value / 100.0;
                    }
                } catch (e) {
                    logError(e, 'ddc-brightness: getvcp failed');
                }
            });
        } catch (e) {
            logError(e, 'ddc-brightness: failed to spawn ddcutil for read');
        }
    }

    destroy() {
        if (this._debounceId) {
            GLib.source_remove(this._debounceId);
            this._debounceId = 0;
        }
        super.destroy();
    }
});

const BrightnessIndicator = GObject.registerClass(
class BrightnessIndicator extends QuickSettings.SystemIndicator {
    _init() {
        super._init();

        this._slider = new BrightnessSlider();
        this.quickSettingsItems.push(this._slider);
    }

    destroy() {
        this._slider.destroy();
        super.destroy();
    }
});

export default class DDCBrightnessExtension {
    enable() {
        this._indicator = new BrightnessIndicator();
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
