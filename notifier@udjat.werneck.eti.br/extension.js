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
 * 
 */

'use strict';

const Main = imports.ui.main;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;

const UdjatIndicator = GObject.registerClass(
	class UdjatIndicator extends PanelMenu.Button {

		_init() {
			super._init(0.0, 'text', false);
	
			this.icon = new St.Icon();
			this.icon.set_icon_size(20);

			let gicon = Gio.icon_new_for_string('/srv/www/htdocs/udjat/icons/notimportant.svg');
			this.icon.set_gicon(gicon);
	
			this.box = new St.BoxLayout();
			this.box.add_child(this.icon);
	
			// TODO: This is deprecated.
			this.actor.add_child(this.box);
		
			Main.panel.addToStatusArea('udjat-indicator', this);
	
		}
	
		destroy() {
		
			super.destroy();

		}
	
		enable() {
			this.box.show();
		}
	
		disable() {
			this.box.hide();
		}
	
	});
		
const UdjatNotifierExtension =
class UdjatNotifierExtension {

	constructor() {

		this.button = new Indicator();

	}
	
	enable() {
		this.button.enable();
	}
	
	disable() {
		this.button.disable();
	}
	
};

function init() {
	return new UdjatNotifierExtension();
}



