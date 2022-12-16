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

const { Soup } = imports.gi;

/// @brief Abstract engine.
var Engine = class {

	constructor(config,group) {
		
		this.controller = null;
		this.url = config.url;
		this.title = config.title;

		if(config.hasOwnProperty('group')) {
			this.group = config.group
		} else {
			this.group = group;
		}

		log(`Loading settings for ${this.url} on group ${this.group}`);
	}

	enabled() {
		return this.controller != null;
	}

	enable(controller) {
		this.controller = controller;
	}

	disable() {
		this.controller = null;
	}

	on_http_response(response) {
		this.on_json_response(JSON.parse(response));
	}

	on_json_response(response) {
		this.set_response({
			'title': this.title,
			'message': 'Invalid or incomplete engine',
			'level': 'error'
		});
	}

	set_response(args) {
		if(this.controller) {
			this.controller.set_response(this.url,this.group,args);
		}
	}

	refresh() {

		try {

			// https://www.roojs.com/seed/gir-1.2-gtk-3.0/gjs/Soup.Session.html
			this.session = new Soup.Session();

			let message = Soup.Message.new('GET', this.url);
			let object = this

			this.session.queue_message(message, Lang.bind(this, function (_httpSession, message) {

				log('vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv');
				
				try {

					if(!object.enabled()) {
						log(`Ignoring response ${message.status_code} from ${object.url}`);
						return;
					}
	
					if(message.status_code == 200) {
	
						object.on_http_response(message.response_body.data);
	
					} else {

						log(`Got http error ${message.status_code} from ${object.url}`);
						this.group = 'engine';
						object.set_response({
							'title': object.title,
							'message': 'Invalid or incomplete engine',
							'level': 'error'
						});
					}
				
				} catch(e) {

					this.log(e);
					this.log(e.stack);
		
					object.set_response({
						'title': object.title,
						'message': e.message,
						'level': 'error'
					});
		
				}

			}));

		} catch(e) {
					
			this.log(e);
			this.log(e.stack);

			object.set_response({
				'title': object.title,
				'message': e.message,
				'level': 'error'
			});

		}

	}

}

/// @brief Standard Udjat agent status
var Udjat = class extends Engine {

	constructor(config) {
		super(config,'udjat');
	}

}

/// @brief URL to old 'mentor' api.
var Mentor = class extends Engine {

	constructor(config) {
		super(config,'mentor');
	}

}
