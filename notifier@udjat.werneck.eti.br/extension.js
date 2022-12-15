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

const { Gio, St, GObject, GLib, Clutter, Soup, Shell } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;

const Levels = {
    'undefined': {
        'value': 0
    },

    'unimportant': {
        'value': 1
    },

    'ready': {
        'value': 2
    },

    'warning': {
        'value': 3
    },

    'error': {
        'value': 4
    },

    'critical': {
        'value': 5
    }

};

const IndicatorItem = GObject.registerClass(
	class IndicatorItem extends PopupMenu.PopupBaseMenuItem {

        // https://github.com/GNOME/gnome-shell/blob/master/js/ui/popupMenu.js
        // https://www.roojs.com/seed/gir-1.2-gtk-3.0/seed/St.BoxLayout.html

		_init(controller, groups) {

            super._init({
                reactive: true,
                activate: false,
                hover: false,
                can_focus: false
            });

            this.controller = controller;
            this.groups = groups;
            this.level = Levels.undefined.value;

            this.widgets = {
                'icon': new St.Icon({
                    'style_class': 'udjat-item-icon',
					'x_expand': false,
					'y_expand': false
                }),
				'title': new St.Label({
					'text': 'title',
                    'style_class': 'udjat-item-title',
					'x_expand': false,
					'x_align': Clutter.ActorAlign.START,
					'y_expand': true,
					'y_align': Clutter.ActorAlign.START
				}),
				'message': new St.Label({
					'text': 'message',
                    'style_class': 'udjat-item-message',
					'x_expand': false,
					'x_align': Clutter.ActorAlign.START,
					'y_expand': true,
					'y_align': Clutter.ActorAlign.START
				})
            };

			let hbox = new St.BoxLayout({
				'vertical': false,
				'x_expand': true,
				'y_expand': true,
                'x_align': Clutter.ActorAlign.START,
                'y_align': Clutter.ActorAlign.START
			});

            this.widgets.icon.set_icon_size(32);

			hbox.add_child(this.widgets.icon);

			let vbox = new St.BoxLayout({
				'vertical': true,
				'x_expand': true,
				'y_expand': true,
                'x_align': Clutter.ActorAlign.START,
                'y_align': Clutter.ActorAlign.START
			});

			vbox.add_child(this.widgets.title);
			vbox.add_child(this.widgets.message);

            hbox.add_child(vbox);

            this.add_child(hbox);

        }

        update(state) {

            this.level = state.level;
            
            this.widgets.icon.set_gicon(state.icon);
            this.widgets.title.set_text(state.title);
            this.widgets.message.set_text(state.message);
        
            this.controller.refresh();

        }

        get_level() {
            return this.level;
        }

        get_gicon() {
            return this.widgets.icon.get_gicon();
        }

    }
);

const Indicator = GObject.registerClass(
	class Indicator extends PanelMenu.Button {

        // https://github.com/GNOME/gnome-shell/blob/master/js/ui/panelMenu.js

		_init(controller) {

            this.controller = controller;
            this.level = Levels.undefined;

            let name = `${Me.metadata.name} Indicator`;

            super._init(0.0, name, false);

            // Add an icon
            this.icon = new St.Icon({
                'style_class': 'udjat-panel-icon',
                'x_expand': false,
                'y_expand': false
            });
            this.icon.set_icon_size(16);
            this.set_icon_name("udjat-undefined");
            this.add_child(this.icon);

        }

        set_gicon(gicon) {
            this.icon.set_gicon(gicon);
        }

        get_gicon() {
            return this.icon.get_gicon();
        }

        set_icon_name(name) {
            this.icon.set_gicon(this.controller.get_icon(name));
        }

    }
);

class UdjatNotifierExtension {

    constructor() {

		this.application = {
            'indicator': null,
			'signal': null,
            'level': Levels.undefined,
			'icons': { },
            'items': { }
		};

	}
    
    get_level() {
        return this.application.level;
    }

    get_icon(name) {

        if(!this.application.icons.hasOwnProperty(name)) {
            log('Loading icon '+ name);
            this.application.icons[name] = Gio.ThemedIcon.new_from_names([name]);
        }

        return this.application.icons[name];
    }

    refresh() {

        let selected = Levels.undefined;
        let icon = null;
        let autohide = this.settings.get_boolean('autohide');

        for(let st in this.application.items) {

            let state = this.application.items[st]; 
            let level = state.get_level();

            if(autohide && level <= Levels.ready.value) {
                continue;
            }
            
            if(level.value >= selected.value) {
                selected = level;
                icon = state.get_gicon();
            }

        }

        if(icon) {
            this.application.indicator.set_gicon(icon);   
            this.application.indicator.show();
        } else {
            this.application.indicator.hide();
        }

    }

    get_state(id,groups) {

        if(!this.application.items.hasOwnProperty(id)) {
            log('Creating state ' + id);
            this.application.items[id] = new IndicatorItem(this,groups);
            this.application.indicator.menu.addMenuItem(this.application.items[id]);
        }

        return this.application.items[id];
        
    }

    enable() {

		log('--------------------------------------------------------------------------------');

        log(`enabling ${Me.metadata.name}`);

        this.settings = ExtensionUtils.getSettings('br.eti.werneck.udjat.gnome');

		let indicatorName = `${Me.metadata.name} Indicator`;

        // Create a panel button
        this.application.indicator = new Indicator(this);
        this.application.indicator.hide();
        
        // Watch udjat main service status.
        this.application.signal = 
        Gio.DBus.system.signal_subscribe(
            null,									// sender name to match on (unique or well-known name) or null to listen from all senders
            'br.eti.werneck.udjat.gnome',			// D-Bus interface name to match on or null to match on all interfaces
            'StateChanged',		        			// D-Bus signal name to match on or null to match on all signals
            null,                					// object path to match on or null to match on all object paths
            null,									// contents of first string argument to match on or null to match on all kinds of arguments
            Gio.DBusSignalFlags.NONE,				// flags describing how to subscribe to the signal (currently unused)
            Lang.bind(this, function(conn, sender, object_path, interface_name, signal_name, args) {
        
                log(object_path);
                log(interface_name);
                log(signal_name);

                try {

                    let state = args.get_child_value(2).deep_unpack();
                    let level = Levels.undefined;

                    if(Levels.hasOwnProperty(state)) {
                        level = Levels[state];
                        log(`Using state "${state}"`);
                    } else {
                        log(`Ignoring unknown state "${state}"`);
                    }

                    log(`level="${level}"`);
                    log(`level.value="${level.value}"`);

                    this.get_state(object_path,['d-bus']).update({
                        'title': args.get_child_value(0).deep_unpack(),
                        'message': args.get_child_value(1).deep_unpack(),
                        'icon': this.get_icon(args.get_child_value(3).deep_unpack()),
                        'level': level
                    })

                } catch(e) {

                    log(e);
                    log(e.stack);

                }
        
            })
        );

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



