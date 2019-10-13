
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

		this.onmessage = new Map();
		this.timeout = 10000;
		this.currentCommand = null;
		this.commandSerial = 1;
	}

	/**
	 * Setter of server URL
	 * @param {string} url Server URL
	 */
	setUrl(url) {
		if (url) {
			const absolutePath = /^\w+:\/\/.+/i;
			if (absolutePath.test(url)) {
				this.url = url;
			} else {
				const domainSplit = url.indexOf('/');
				let domain = '';
				let path = '';
				if (domainSplit === -1) {
					domain = url;
				} else {
					domain = url.substr(0, domainSplit);
					path = url.substr(domainSplit + 1);
				}
				if (domain.indexOf(':') >= 0) {
					this.url = `ws://${domain}/${path}`;
				} else {
					this.url = `ws://${domain}:2610/${path}`;
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
			return Promise.reject(new Error('No Url is defined.'));
		}

		try {
			this.socket = new WebSocket(this.url);
		} catch (error) {
			this.emit('error', error.message);
			return Promise.reject(error);
		}

		this.socket.onmessage = (e) => {
			const packet = new Packet(e.data);
			this.trigger(packet.command, packet.arguments);
		};

		return new Promise((resolve, reject) => {
			this.socket.onopen = () => {
				this.emit('open');
				setTimeout(resolve, 0);
			};
			this.socket.onclose = (e) => {
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
			const disconnected = new Promise((resolve, reject) => {
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
	get connected() {
		return this.socket && this.socket.readyState === WebSocket.OPEN;
	}

	/**
	 * Connection state
	 * @return {number}
	 */
	get state() {
		if (this.socket) {
			return this.socket.readyState;
		}
		return WebSocket.CONNECTING;
	}

	/**
	 * Send a command to server
	 * @param {number} command
	 * @param {object} args
	 */
	send(command, args = null) {
		const packet = new Packet();
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
			this.bind(command, resolve, { once: true });
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
		const handlers = this.onmessage.get(command);
		if (!handlers) {
			return;
		}

		this.currentCommand = command;

		const removed = [];
		for (const handler of handlers) {
			handler.callback.call(this, args);
			if (handler.options && handler.options.once) {
				removed.push(handler);
			}
		}

		for (const handler of removed) {
			handlers.delete(handler);
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
			handlers = [];
			this.onmessage.set(command, handlers);
		}

		handlers.add({
			callback,
			options,
		});
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
			const handlers = this.onmessage.get(command);
			if (handlers) {
				for (let i = 0; i < handlers.length; i++) {
					const handler = handlers[i];
					if (handler.callback === callback) {
						handlers.splice(i, 1);
						break;
					}
				}
			}
		}
	}

	/**
	 * Create a locker for the current server command.
	 * @return {object}
	 */
	lock() {
		const command = this.currentCommand;
		const serial = ++this.commandSerial;
		this.emit('lockChanged');
		return {
			command,
			serial,
		};
	}

	/**
	 * Sends a command to server if it's still wanted.
	 * @param {object} locker
	 * @param {*} args
	 * @return {boolean}
	 */
	reply(locker, args) {
		if (locker.command !== this.currentCommand || locker.serial !== this.commandSerial) {
			return false;
		}

		this.send(locker.command, args);
		return true;
	}
}

export default Client;
