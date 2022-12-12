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

class UdjatNotifierExtension {

    constructor() {

        this.indicator = null;

		this.icons = { 
        }

	}
    
    get_icon(name) {

        if(!this.icons.hasOwnProperty(name)) {
            log('Loading icon '+ name);
            //this.icons[name] = Gio.icon_new_for_string('/srv/www/htdocs/udjat/icons/' + name + '.svg');
            this.icons[name] = Gio.ThemedIcon.new_from_names(['udjat-' + name]);
        }

        return this.icons[name];
    }

    enable() {

		log('--------------------------------------------------------------------------------');

        log(`enabling ${Me.metadata.name}`);

        //this.settings = ExtensionUtils.getSettings(
        //   'br.eti.werneck.udjat.gnome');

		let indicatorName = `${Me.metadata.name} Indicator`;

        // Create a panel button
        this.indicator = new PanelMenu.Button(0.0, indicatorName, false);
        
        // Add an icon
		this.icon = new St.Icon();
		this.icon.set_icon_size(20);
		this.icon.set_gicon(this.get_icon("ready-symbolic"));
		
        this.indicator.add_child(this.icon);

        // Bind our indicator visibility to the GSettings value
        //
        // NOTE: Binding properties only works with GProperties (properties
        // registered on a GObject class), not native JavaScript properties
        //this.settings.bind(
        //    'show-indicator',
        //    this.indicator,
        //    'visible',
        //    Gio.SettingsBindFlags.DEFAULT
        //);

		this.indicator.show();

        Main.panel.addToStatusArea(indicatorName, this.indicator);
    }
    
    disable() {
        log(`disabling ${Me.metadata.name}`);

        this.indicator.destroy();
        this.indicator = null;
    }
}

function init() {
	return new UdjatNotifierExtension();
}



