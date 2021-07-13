import { EventEmitter } from 'events';
import Packet from './Packet';

interface Locker {
	command: number;
	serial: number;
}

interface CallbackOptions {
	once: boolean;
}

type Callback = (args?: unknown) => void;

interface MessageListener {
	callback: Callback;
	options?: CallbackOptions;
}

declare interface Client {
	on(event: 'error', listener: (message: string) => void): this;
	on(event: 'open', listener: () => void): this;
	on(event: 'close', listener: () => void): this;
	on(event: 'lockChanged', listener: () => void): this;

	once(event: 'error', listener: (message: string) => void): this;
	once(event: 'open', listener: () => void): this;
	once(event: 'close', listener: (event: CloseEvent) => void): this;
	once(event: 'lockChanged', listener: () => void): this;
}

class Client extends EventEmitter {
	protected url: string;

	protected socket: WebSocket | null;

	protected onmessage: Map<number, MessageListener[]>;

	protected timeout: number;

	protected currentCommand: number;

	protected commandSerial: number;

	/**
	 * Create a client instance
	 */
	constructor() {
		super();

		this.url = '';
		this.socket = null;

		this.onmessage = new Map();
		this.timeout = 10000;
		this.currentCommand = 0;
		this.commandSerial = 0;
	}

	/**
	 * Gets URL of the server.
	 */
	getUrl(): string {
		return this.url;
	}

	/**
	 * Setter of server URL
	 * @param url Server URL
	 */
	setUrl(url?: string): void {
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
	 * @param url server URL
	 */
	connect(url?: string): Promise<void> {
		if (url) {
			this.setUrl(url);
		}

		if (!this.url) {
			return Promise.reject(new Error('No url is defined.'));
		}

		try {
			this.socket = new WebSocket(this.url);
		} catch (error) {
			this.emit('error', error.message);
			return Promise.reject(error);
		}

		this.socket.onmessage = (e): void => {
			const packet = new Packet(e.data);
			this.trigger(packet.command, packet.arguments);
		};

		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('WebSocket is closed.'));
				return;
			}

			this.socket.onopen = (): void => {
				this.emit('open');
				setTimeout(resolve, 0);
			};
			this.socket.onclose = (e): void => {
				this.emit('close', e);
				this.socket = null;
				setTimeout(reject, 0, new Error('WebSocket is closed.'));
			};
		});
	}

	/**
	 * Disconnect from the server
	 */
	disconnect(): Promise<void> {
		if (this.socket) {
			const disconnected = new Promise<void>((resolve, reject) => {
				const timer = setTimeout(reject, 60000, 'Disconnection timed out.');
				this.once('close', () => {
					clearTimeout(timer);
					resolve();
				});
			});

			this.socket.close();
			this.socket = null;

			return disconnected;
		}

		return Promise.resolve();
	}

	/**
	 * Check if it's connected to a server
	 */
	get connected(): boolean {
		return Boolean(this.socket && this.socket.readyState === WebSocket.OPEN);
	}

	/**
	 * Connection state
	 */
	get state(): number {
		if (this.socket) {
			return this.socket.readyState;
		}
		return WebSocket.CONNECTING;
	}

	/**
	 * Send a command to server
	 * @param command
	 * @param args
	 */
	send(command: number, args?: unknown): void {
		if (!this.socket) {
			return;
		}

		const packet = new Packet();
		packet.command = command;
		packet.arguments = args;
		packet.timeout = 0;
		this.socket.send(packet.toJSON());
	}

	/**
	 * Send a command to server and wait for its reply
	 * @param command
	 * @param args
	 */
	request(command: number, args?: unknown): Promise<any> {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(reject, this.timeout, 'Command timed out.');
			this.bind(command, (res?: unknown): void => {
				clearTimeout(timer);
				resolve(res);
			}, { once: true });
			this.send(command, args);
		});
	}

	/**
	 * Trigger a message handler
	 * @param command
	 * @param args
	 */
	trigger(command: number, args?: any): void {
		const handlers = this.onmessage.get(command);
		if (!handlers) {
			return;
		}

		this.currentCommand = command;

		let limit = handlers.length;
		for (let i = 0; i < limit; i++) {
			const handler = handlers[i];
			handler.callback.call(this, args);
			if (handler.options && handler.options.once) {
				handlers.splice(i, 1);
				i--;
				limit--;
			}
		}
	}

	/**
	 * Bind a message handler
	 * @param command
	 * @param callback
	 * @param options
	 */
	bind(command: number, callback: Callback, options?: CallbackOptions): void {
		let handlers = this.onmessage.get(command);
		if (!handlers) {
			handlers = [];
			this.onmessage.set(command, handlers);
		}

		handlers.push({
			callback,
			options,
		});
	}

	/**
	 * Unbind a message handler
	 * @param command
	 * @param callback
	 */
	unbind(command: number, callback?: Callback): void {
		if (!callback) {
			this.onmessage.delete(command);
		} else {
			const handlers = this.onmessage.get(command);
			if (!handlers) {
				return;
			}

			for (let i = 0; i < handlers.length; i++) {
				const handler = handlers[i];
				if (handler.callback === callback) {
					handlers.splice(i, 1);
					break;
				}
			}
		}
	}

	/**
	 * Create a locker for the current server command.
	 */
	lock(): Locker {
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
	 * @param locker
	 * @param args
	 * @return {boolean}
	 */
	reply(locker: Locker, args: any): boolean {
		if (locker.command !== this.currentCommand || locker.serial !== this.commandSerial) {
			return false;
		}

		this.send(locker.command, args);
		return true;
	}
}

export default Client;
