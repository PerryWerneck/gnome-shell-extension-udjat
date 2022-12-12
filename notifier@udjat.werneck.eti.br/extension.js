/*
 * 
 * This file is part of udjat.
 * 
 * dbstatusicon is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * dbstatusicon is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with dbstatusicon.  If not, see <https://www.gnu.org/licenses/>.
 * 
 */

/* jshint -W100 */
/* history */
/* exported init */

/*
 * References:
 *
 * https://github.com/julio641742/gnome-shell-extension-reference/blob/master/REFERENCE.md
 * https://gjs.guide/extensions/development/preferences.html#integrating-gsettings
 * 
 */

'use strict';

const Gio = imports.gi.Gio;
const St = imports.gi.St;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Lang = imports.lang;

class UdjatNotifierExtension {

    constructor() {

		this.application = {
            'indicator': null,
			'signal': null,
			'icons': { }
		};

	}
    
    get_icon(name) {

        if(!this.application.icons.hasOwnProperty(name)) {
            log('Loading icon '+ name);
            this.application.icons[name] = Gio.ThemedIcon.new_from_names(['udjat-' + name]);
        }

        return this.application.icons[name];
    }

    enable() {

		log('--------------------------------------------------------------------------------');

        log(`enabling ${Me.metadata.name}`);

        //this.settings = ExtensionUtils.getSettings(
        //   'br.eti.werneck.udjat.gnome');

		let indicatorName = `${Me.metadata.name} Indicator`;

        // Create a panel button
        this.application.indicator = new PanelMenu.Button(0.0, indicatorName, false);
        
        // Add an icon
		this.icon = new St.Icon();
		this.icon.set_icon_size(16);
		this.icon.set_gicon(this.get_icon("ready-symbolic"));
		
        this.application.indicator.add_child(this.icon);

        // dbus-monitor --system type=signal interface="br.eti.werneck.udjat.gnome"
        this.application.signal = 
        Gio.DBus.system.signal_subscribe(
            null,									// sender name to match on (unique or well-known name) or null to listen from all senders
            'br.eti.werneck.udjat.gnome',			// D-Bus interface name to match on or null to match on all interfaces
            'GlobalStateChanged',					// D-Bus signal name to match on or null to match on all signals
            null,                					// object path to match on or null to match on all object paths
            null,									// contents of first string argument to match on or null to match on all kinds of arguments
            Gio.DBusSignalFlags.NONE,				// flags describing how to subscribe to the signal (currently unused)
            Lang.bind(this, function(conn, sender, object_path, interface_name, signal_name, args) {
        
                log(object_path);
                log(interface_name);
                log(signal_name);

                try {

                    // for (let i in args.get_child_value(0)) log(i);
                    this.icon.set_gicon(this.get_icon(args.get_child_value(0).deep_unpack()));
 
                } catch(e) {

                    log(e);
                    log(e.stack);

                }
        
            })
        );

        this.application.indicator.show();

        // Bind our indicator visibility to the GSettings value
        //
        // NOTE: Binding properties only works with GProperties (properties
        // registered on a GObject class), not native JavaScript properties
        //this.settings.bind(
        //    'show-indicator',
        //    this.application.indicator,
        //    'visible',
        //    Gio.SettingsBindFlags.DEFAULT
        //);

        Main.panel.addToStatusArea(indicatorName, this.application.indicator);

    }
    
    disable() {
        log(`disabling ${Me.metadata.name}`);

		if(this.application.signal) {
			Gio.DBus.system.signal_unsubscribe(this.application.signal);			
			this.application.signal = null;
		}		

        this.application.indicator.destroy();
        this.application.indicator = null;
    }
}

function init() {
	return new UdjatNotifierExtension();
}



