import {
	Context,
	RoomConfiguration,
	RoomProfile,
	UserProfile,
} from '@karuta/core';
import { EventEmitter } from 'events';

import Client from './Client';

interface Room {
	on(event: 'configChanged', listener: (config?: RoomConfiguration) => void): this;

	once(event: 'configChanged', listener: (config?: RoomConfiguration) => void): this;

	off(event: 'configChanged', listener: (config?: RoomConfiguration) => void): this;

	emit(event: 'configChanged', config?: RoomConfiguration): boolean;
}

class Room extends EventEmitter {
	protected client: Client;

	protected id = 0;

	protected owner?: UserProfile;

	protected config?: RoomConfiguration;

	constructor(client: Client) {
		super();
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
		this.setConfig(res.config);
		return true;
	}

	getConfig(): RoomConfiguration | undefined {
		return this.config;
	}

	setConfig(config?: RoomConfiguration): void {
		this.config = config;
		this.emit('configChanged', config);
	}

	async updateConfig(update: Partial<RoomConfiguration>): Promise<boolean> {
		const success = Boolean(await this.client.patch(Context.Room, update));
		if (success) {
			Object.assign(this.config, update);
			this.emit('configChanged', this.config);
		}
		return success;
	}

	async fetchConfig(): Promise<boolean> {
		const update = await this.client.head(Context.Room) as RoomConfiguration;
		if (!update) {
			return false;
		}

		this.config = update;
		this.emit('configChanged', update);
		return true;
	}
}

export default Room;
