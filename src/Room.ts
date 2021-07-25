import {
	Context,
	RoomConfiguration,
	RoomProfile,
	UserProfile,
} from '@karuta/core';

import Client from './Client';

export default class Room {
	protected client: Client;

	protected id = 0;

	protected owner?: UserProfile;

	protected config?: RoomConfiguration;

	constructor(client: Client) {
		this.client = client;
	}

	getId(): number {
		return this.id;
	}

	getOwner(): UserProfile | undefined {
		return this.owner;
	}

	isValid(): boolean {
		return this.id > 0;
	}

	async create(): Promise<void> {
		const id = await this.client.put(Context.Room);
		if (typeof id !== 'number') {
			throw new Error(`Unexpected response: ${id}`);
		}

		this.id = id;
	}

	async enter(id: number): Promise<boolean> {
		const res = await this.client.post(Context.Room, id) as RoomProfile;
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
}
