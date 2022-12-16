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

// https://gitlab.gnome.org/GNOME/gnome-shell/blob/main/js/misc/extensionUtils.js
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const MessageTray = imports.ui.messageTray;

const Engines = Me.imports.engines;

const Levels = {

    'undefined': {
        'value': 0,
        'notify': false
    },

    'unimportant': {
        'value': 1,
        'notify': false
    },

    'ready': {
        'value': 2,
        'notify': false
    },

    'warning': {
        'value': 3,
        'notify': true
    },

    'error': {
        'value': 4,
        'notify': true
    },

    'critical': {
        'value': 5,
        'notify': true
    },

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

            this.widgets.icon.set_gicon(state.icon);
            this.widgets.title.set_text(state.title);
            this.widgets.message.set_text(state.message);
        
            if(this.level.value != state.level.value) {

                this.level = state.level;

                if(this.level.notify) {
                    this.controller.refresh();
                    this.notify();
                    return true;
                }

            }

            return false;
            
        }

        notify() {
            // https://github.com/franglais125/update-extensions/blob/master/extension.js
            // https://github.com/GNOME/gnome-shell/blob/master/js/ui/messageTray.js
            let source = new MessageTray.Source(
                this.widgets.message.get_text(),
                this.widgets.icon.get_gicon().to_string()
            );

            let notification = 
                new MessageTray.Notification(
                    source, 
                    this.widgets.title.get_text(), 
                    this.widgets.message.get_text()
                );

            Main.messageTray.add(source);
            notification.setTransient(true);
            source.notify(notification);

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

        this.settings = ExtensionUtils.getSettings('br.eti.werneck.udjat.gnome');

        this.application = {
            'indicator': null,
			'signal': null,
            'level': Levels.undefined,
			'icons': { },
            'items': { },
            'loaders': [ ],
            'timer': null
		};

        let file = this.get_settings_file();

        if (file.query_exists(null)) {

            let controller = this;
            file.load_contents_async(null, function(obj, res) {

                let [success, contents] = obj.load_contents_finish(res);
                if(success) {

                    contents = JSON.parse(imports.byteArray.toString(contents));
                    for(let ix in contents) {

                        try {

                            if(!contents[ix].hasOwnProperty('url')) {
                                log('Ignoring setting withou URL');
                                continue;
                            }
  
                            if(!contents[ix].hasOwnProperty('engine')) {
                                contents[ix].engine = 'Udjat';
                            }

                            let engine = contents[ix].engine.charAt(0).toUpperCase() + contents[ix].engine.slice(1);
                            controller.application.loaders.push(new Engines[engine](controller,contents[ix]));
                        
                        } catch(e) {

                            log(e);
                            log(e.stack);
                        
                        }
                    }

                } else {
                    log(`Error loading ${filename}`);
                }
            });
        }

	}
    
    get_settings_file() {

        // https://gjs.guide/guides/gtk/3/15-saving-data.html#saving-data-to-a-file

        let filename = GLib.build_filenamev([GLib.get_user_config_dir(), 'udjat', 'gnome-shell-extension.json']);
        let file = Gio.file_new_for_path(filename);
        GLib.mkdir_with_parents(file.get_parent().get_path(),0o755);
        return file;
        
    }

    get_level() {
        return this.application.level;
    }

    get_level_from_name(lvl) {
        if(Levels.hasOwnProperty(lvl))
            return Levels[lvl];
        return Levels.undefined;
    }

    get_icon(name) {

        if(!this.application.icons.hasOwnProperty(name)) {
            log('Loading icon ' + name);
            this.application.icons[name] = Gio.ThemedIcon.new_from_names([name]);
        }

        log('Using cached icon ' + name)
        return this.application.icons[name];
    }

    refresh() {

        let selected = Levels.undefined;
        let icon = null;
        let autohide = this.settings.get_boolean('autohide');

        for(let st in this.application.items) {

            let state = this.application.items[st]; 
            let level = state.get_level();

            if(autohide && level.value <= Levels.ready.value) {
                log(`Ignoring state ${st} with level ${level.value}`);
                continue;
            }
            
            if(level.value >= selected.value) {
                selected = level;
                icon = state.get_gicon();
                log(`Selecting state ${st} with level ${level.value}`);
            } else {
                log(`State ${st} has level ${level.value} lower than selected ${selected.value}`);
            }

        }

        log(`Current level is ${selected.value}`);

        if(icon) {
            this.application.indicator.set_gicon(icon);   
            this.application.indicator.show();
        } else {
            log("No icon, disabling");
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

    set_response(url,group,args) {

        this.get_state(url,[group]).update({
            'title': args.title,
            'message': args.message,
            'icon': this.get_icon('udjat-' + args.level),
            'level': this.get_level_from_name(args.level)
        });

    }

    enable() {

        log(`enabling ${Me.metadata.name}`);

		let indicatorName = `${Me.metadata.name} Indicator`;

        // Create a panel button
        this.application.indicator = new Indicator(this);
        this.application.indicator.hide();

        // Activate timer
		this.application.timer = GLib.timeout_add(
			GLib.PRIORITY_DEFAULT,
			1000,
			Lang.bind(this, function() {

                let timestamp = Math.floor(new Date().getTime() / 1000);
                for(let ld in this.application.loaders) {
                    let loader = this.application.loaders[ld];
                    if(loader.enabled() && timestamp >= loader.next) {
                        loader.refresh();
                    }
                }

                return true;

            })
        );
        
        // Watch signals.
        this.application.signal = 
        Gio.DBus.system.signal_subscribe(
            null,									// sender name to match on (unique or well-known name) or null to listen from all senders
            'br.eti.werneck.udjat.gnome',			// D-Bus interface name to match on or null to match on all interfaces
            null,       		        			// D-Bus signal name to match on or null to match on all signals
            null,                					// object path to match on or null to match on all object paths
            null,									// contents of first string argument to match on or null to match on all kinds of arguments
            Gio.DBusSignalFlags.NONE,				// flags describing how to subscribe to the signal (currently unused)
            Lang.bind(this, function(conn, sender, object_path, interface_name, signal_name, variant) {
        
                try {

                    let args = [];
                    for(let ix = 0; ix < variant.n_children(); ix++) {
                        args.push(variant.get_child_value(ix).deep_unpack());
                    }

                    if(signal_name == 'StateChanged' && args.length > 3) {
                        this.get_state(object_path,['d-bus']).update({
                            'title': args[0],
                            'message': args[1],
                            'icon': this.get_icon(args[3]),
                            'level': this.get_level_from_name(args[2])
                        });
                    } else {
                        log(`Unexpected or invalid signal "${signal_name}"`);
                    }

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

		if(this.application.timer) {
			GLib.source_remove(this.application.timer);
			this.application.timer = null;
		}

        for(let loader in this.application.loaders) {
           this.application.loaders[ld].disable();
        }

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



