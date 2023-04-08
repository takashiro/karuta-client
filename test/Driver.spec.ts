import { Context } from '@karuta/core';

import Client from '../src/Client';
import Driver from '../src/Driver';

const put = jest.fn();
const del = jest.fn();
const get = jest.fn();
const head = jest.fn();
const patch = jest.fn();
const client = {
	put,
	delete: del,
	get,
	head,
	patch,
} as unknown as Client;

const driver = new Driver(client, 'jest');

describe('Loading', () => {
	it('loads a driver', async () => {
		await driver.load();
		expect(put).toBeCalledWith(Context.Driver, 'jest');
	});

	it('unloads a driver', async () => {
		await driver.unload();
		expect(del).toBeCalledWith(Context.Driver);
	});
});

describe('Synchronize', () => {
	it('checks the existing one', async () => {
		const ret = await driver.sync();
		expect(ret).toBe(false);
	});

	it('loads existing one', async () => {
		get.mockResolvedValueOnce({
			name: 'karuta',
			config: {
				oh: 2,
			},
		});
		await driver.sync();
		expect(driver.getName()).toBe('karuta');
		expect(driver.getConfig()).toStrictEqual({ oh: 2 });
	});
});

describe('Configuration', () => {
	it('modifies configuration unsuccessfully', async () => {
		const ret = await driver.updateConfig({ oh: 3 });
		expect(patch).toBeCalledWith(Context.Driver, { oh: 3 });
		expect(ret).toBe(false);
		expect(driver.getConfig()).toStrictEqual({ oh: 2 });
		patch.mockClear();
	});

	it('modifies configuration successfully', async () => {
		patch.mockResolvedValueOnce('yes');
		const ret = await driver.updateConfig({ oh: 3 });
		expect(patch).toBeCalledWith(Context.Driver, { oh: 3 });
		expect(ret).toBe(true);
		expect(driver.getConfig()).toStrictEqual({ oh: 3 });
	});

	it('cannot update configuration before fetching it', async () => {
		const d = new Driver(client, 'temp');
		expect(() => d.updateConfig({})).rejects.toThrowError('Please fetch the latest configuration first.');
	});

	it('loads configuration unsuccessfully', async () => {
		const ret = await driver.fetchConfig();
		expect(ret).toBe(false);
		expect(driver.getConfig()).toStrictEqual({ oh: 3 });
	});

	it('loads configuration successfully', async () => {
		head.mockResolvedValueOnce({
			oh: 4,
			my: 5,
		});
		const ret = await driver.fetchConfig();
		expect(ret).toBe(true);
		expect(driver.getConfig()).toStrictEqual({
			oh: 4,
			my: 5,
		});
	});
});
