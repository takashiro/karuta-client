import { Connection, Context } from '@karuta/protocol';

export default class Room<Config> {
	protected socket: Connection;

	protected id: number;

	protected config?: Config;

	constructor(socket: Connection, id: number) {
		this.socket = socket;
		this.id = id;
	}

	getId(): number {
		return this.id;
	}

	getConfig(): Config | undefined {
		return this.config;
	}

	async loadDriver(driverName: string): Promise<void> {
		await this.socket.put(Context.Driver, driverName);
	}
}
