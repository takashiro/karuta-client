

import EventEmitter from 'events';
import Packet from './Packet';

class Client extends EventEmitter {

	/**
	 * Create a client instance
	 * @param {string} url Server URL
	 */
	constructor(url) {
		super();

		this.setUrl(url);
		this.socket = null;

		this.onmessage = new Map;
		this.timeout = 10000;
	}

	/**
	 * Setter of server URL
	 * @param {string} url Server URL
	 */
	setUrl(url) {
		if (url) {
			let absolute_path = /^\w+:\/\/.+/i;
			if (absolute_path.test(url)) {
				this.url = url;
			} else {
				let domain_split = url.indexOf('/');
				let domain = '';
				let path = '';
				if (domain_split == -1) {
					domain = url;
				} else {
					domain = url.substr(0, domain_split);
					path = url.substr(domain_split + 1);
				}
				if (domain.indexOf(':') >= 0) {
					this.url = 'ws://' + domain + '/' + path;
				} else {
					this.url = 'ws://' + domain + ':2610/' + path;
				}
			}
		} else {
			this.url = '';
		}
	}

	/**
	 * Connect to a server
	 * @param {string} url server URL
	 * @return {Promise}
	 */
	connect(url = null) {
		if (url) {
			this.setUrl(url);
		}

		if (!this.url) {
			return Promise.reject('No Url is defined.');
		}

		try {
			this.socket = new WebSocket(this.url);
		} catch (error) {
			this.emit('error', error.message);
			return Promise.reject(error);
		}

		this.socket.onmessage = e => {
			let packet = new Packet(e.data);
			this.trigger(packet.command, packet.arguments);
		};

		return new Promise((resolve, reject) => {
			this.socket.onopen = () => {
				this.emit('open');
				setTimeout(resolve, 0);
			};
			this.socket.onclose = e => {
				this.emit('close', e);
				this.socket = null;
				setTimeout(reject, 0);
			};
		});
	}

	/**
	 * Disconnect from the server
	 * @return {Promise}
	 */
	disconnect() {
		if (this.socket) {
			let disconnected = new Promise((resolve, reject) => {
				this.once('close', resolve);
				setTimeout(reject, 60000, 'Disconnection timed out.');
			});

			this.socket.close();
			this.socket = null;

			return disconnected;
		}

		return Promise.resolve();
	}

	/**
	 * Check if it's connected to a server
	 * @param {boolean}
	 */
	get connected(){
		return this.socket && this.socket.readyState == WebSocket.OPEN;
	}

	/**
	 * Connection state
	 * @return {number}
	 */
	get state(){
		if (this.socket) {
			return this.socket.readyState;
		} else {
			return WebSocket.CONNECTING;
		}
	}

	/**
	 * Send a command to server
	 * @param {number} command
	 * @param {object} args
	 */
	send(command, args = null) {
		let packet = new Packet;
		packet.command = command;
		packet.arguments = args;
		packet.timeout = 0;
		this.socket.send(packet.toJSON());
	}

	/**
	 * Send a command to server and wait for its reply
	 * @param {number} command
	 * @param {object} args
	 */
	request(command, args = null) {
		return new Promise((resolve, reject) => {
			this.bind(command, resolve, {once: true});
			this.send(command, args);
			setTimeout(reject, this.timeout, 'Command timed out.');
		});
	}

	/**
	 * Trigger a message handler
	 * @param {number} command
	 * @param {object} args
	 */
	trigger(command, args = null) {
		let handlers = this.onmessage.get(command);
		if (handlers) {
			for (let handler of handlers) {
				handler.call(this, args);
			}

			let removed = [];
			for (let handler of handlers) {
				if (handler.once) {
					removed.push(handler);
				}
			}
			for (let handler of removed) {
				handlers.delete(handler);
			}
		}
	}

	/**
	 * Bind a message handler
	 * @param {number} command
	 * @param {Function} callback
	 * @param {object} options
	 */
	bind(command, callback, options = null) {
		let handlers = this.onmessage.get(command);
		if (!handlers) {
			handlers = new Set;
			this.onmessage.set(command, handlers);
		}

		if (options && options.once) {
			callback.once = true;
		}
		handlers.add(callback);
	}

	/**
	 * Unbind a message handler
	 * @param {number} command
	 * @param {Function} callback
	 */
	unbind(command, callback = null) {
		if (!callback) {
			this.onmessage.delete(command);
		} else {
			let handlers = this.onmessage.get(command);
			if (handlers) {
				handlers.delete(callback);
			}
		}
	}

}

export default Client;
