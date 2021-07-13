import { Connection } from '@karuta/protocol';

class Client {
	protected url = '';

	protected socket?: Connection;

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
}

export default Client;
