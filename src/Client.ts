import {
	Connection,
	Context,
	ContextListener,
	Method,
} from '@karuta/core';

class Client {
	protected url = '';

	protected socket?: Connection;

	protected uid = 0;

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

		const socket = new WebSocket(this.url);
		this.socket = new Connection(socket);
		return this.socket.open();
	}

	/**
	 * Disconnect from the server
	 */
	disconnect(): Promise<void> {
		if (!this.socket) {
			return Promise.resolve();
		}

		const disconnected = this.socket.close();
		delete this.socket;
		return disconnected;
	}

	/**
	 * @return Connectionto server
	 */
	getSocket(): Connection | undefined {
		return this.socket;
	}

	/**
	 * Check if it's connected to a server
	 */
	isConnected(): boolean {
		return Boolean(this.socket && this.socket.getReadyState() === WebSocket.OPEN);
	}

	/**
	 * Connection state
	 */
	getState(): number {
		if (this.socket) {
			return this.socket.getReadyState();
		}
		return WebSocket.CONNECTING;
	}

	/**
	 * @return User ID. It is 0 by default.
	 */
	getUid(): number {
		return this.uid;
	}

	/**
	 * @return Version number of server
	 */
	async checkVersion(): Promise<string> {
		const version = await this.get(Context.Version);
		return version as string;
	}

	/**
	 * Log in the server.
	 * @param name User name on the screen
	 * @return Whether login is successful.
	 */
	async login(name?: string): Promise<boolean> {
		const uid = await this.post(Context.UserSession, { name });
		this.uid = uid as number;
		return this.uid > 0;
	}

	/**
	 * Log out the server.
	 */
	async logout(): Promise<void> {
		if (!this.socket) {
			return;
		}

		this.uid = 0;

		const { socket } = this;
		delete this.socket;

		await socket.delete(Context.UserSession);
		await this.disconnect();
	}

	/**
	 * Send a GET request.
	 * @param context
	 * @param params
	 * @returns Response from server
	 */
	async get(context: number, params?: unknown): Promise<unknown> {
		return this.socket?.get(context, params);
	}

	/**
	 * Send a HEAD request.
	 * @param context
	 * @param params
	 * @returns Response from server
	 */
	async head(context: number, params?: unknown): Promise<unknown> {
		return this.socket?.head(context, params);
	}

	/**
	 * Send a POST request.
	 * @param context
	 * @param params
	 * @returns Response from server
	 */
	async post(context: number, params?: unknown): Promise<unknown> {
		return this.socket?.post(context, params);
	}

	/**
	 * Send a PUT request.
	 * @param context
	 * @param params
	 * @returns Response from server
	 */
	async put(context: number, params?: unknown): Promise<unknown> {
		return this.socket?.put(context, params);
	}

	/**
	 * Send a PATCH request.
	 * @param context
	 * @param params
	 * @returns Response from server
	 */
	async patch(context: number, params?: unknown): Promise<unknown> {
		return this.socket?.patch(context, params);
	}

	/**
	 * Send a DELETE request.
	 * @param context
	 * @param params
	 * @returns Response from server
	 */
	async delete(context: number, params?: unknown): Promise<unknown> {
		return this.socket?.delete(context, params);
	}

	/**
	 * Send a request.
	 * @param method
	 * @param context
	 * @param params
	 * @returns Response from server
	 */
	async request(method: Method, context: number, params?: unknown): Promise<unknown> {
		return this.socket?.request(method, context, params);
	}

	/**
	 * Send a notification.
	 * @param method
	 * @param context
	 * @param params
	 */
	notify(method: Method, context: number, params?: unknown): void {
		this.socket?.notify(method, context, params);
	}

	/**
	 * Bind a context listener.
	 * @param listener
	 */
	on(listener: ContextListener): void {
		this.socket?.on(listener);
	}
}

export default Client;
