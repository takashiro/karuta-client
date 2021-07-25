import {
	Connection,
	Context,
	RoomConfiguration,
	RoomProfile,
	UserProfile,
} from '@karuta/core';

export default class Room {
	protected socket: Connection;

	protected id = 0;

	protected owner?: UserProfile;

	protected config?: RoomConfiguration;

	constructor(socket: Connection) {
		this.socket = socket;
	}

	getId(): number {
		return this.id;
	}

	getOwner(): UserProfile | undefined {
		return this.owner;
	}

	async create(): Promise<void> {
		if (!this.socket) {
			throw new Error('Disconnected from server');
		}

		const id = await this.socket.put(Context.Room);
		if (typeof id !== 'number') {
			throw new Error(`Unexpected response: ${id}`);
		}

		this.id = id;
	}

	async enter(id: number): Promise<boolean> {
		const res = await this.socket.post(Context.Room, id) as RoomProfile;
		if (!res) {
			return false;
		}

		this.id = res.id;
		this.owner = res.owner;
		this.config = res.config;
		return true;
	}

	getConfig(): RoomConfiguration | undefined {
		return this.config;
	}

	async loadDriver(driverName: string): Promise<boolean> {
		return await this.socket.put(Context.Driver, driverName) as boolean;
	}

	async unloadDriver(): Promise<boolean> {
		return await this.socket.delete(Context.Driver) as boolean;
	}
}
