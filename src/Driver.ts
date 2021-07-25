import {
	Context,
	DriverProfile,
} from '@karuta/core';

import Client from './Client';

export default class Driver<Config> {
	protected client: Client;

	protected name: string;

	protected config?: Config;

	constructor(client: Client, name: string) {
		this.client = client;
		this.name = name;
	}

	getName(): string {
		return this.name;
	}

	getConfig(): Config | undefined {
		return this.config;
	}

	async load(): Promise<boolean> {
		return await this.client.put(Context.Driver, this.name) as boolean;
	}

	async unload(): Promise<boolean> {
		return await this.client.delete(Context.Driver) as boolean;
	}

	async sync(): Promise<boolean> {
		const profile = await this.client.get(Context.Driver) as DriverProfile<Config>;
		if (!profile) {
			return false;
		}

		this.name = profile.name;
		this.config = profile.config;
		return true;
	}

	async updateConfig(update: Partial<Config>): Promise<boolean> {
		const success = Boolean(await this.client.patch(Context.Driver, update));
		if (success) {
			Object.assign(this.config, update);
		}
		return success;
	}

	async fetchConfig(): Promise<boolean> {
		const update = await this.client.head(Context.Driver) as Config;
		if (!update) {
			return false;
		}

		this.config = update;
		return true;
	}
}