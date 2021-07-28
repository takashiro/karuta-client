import { Context } from '@karuta/core';

import Client from '../src/Client';
import Room from '../src/Room';

const put = jest.fn();
const post = jest.fn();
const patch = jest.fn();
const head = jest.fn();
const client = {
	put,
	post,
	patch,
	head,
} as unknown as Client;
const room = new Room(client);

describe('#create()', () => {
	it('creates a new room', async () => {
		put.mockResolvedValueOnce(666);
		await room.create();
		expect(room.getId()).toBe(666);
		expect(room.isValid()).toBe(true);
	});

	it('handles unexpected responses', () => {
		put.mockResolvedValueOnce('error');
		return expect(() => room.create()).rejects.toThrowError('Unexpected response: error');
	});
});

describe('#enter()', () => {
	it('tries to enter a non-existing room', async () => {
		const res = await room.enter(1);
		expect(res).toBe(false);
	});

	it('enters a room', async () => {
		post.mockResolvedValueOnce({
			id: 2,
			owner: {
				id: 1,
				name: 'me',
			},
			config: {
				a: 99,
			},
		});
		await room.enter(2);
		expect(room.getId()).toBe(2);
		expect(room.getOwner()).toStrictEqual({
			id: 1,
			name: 'me',
		});
		expect(room.getConfig()).toStrictEqual({
			a: 99,
		});
	});
});

describe('#updateConfig()', () => {
	it('modifies configuration unsuccessfully', async () => {
		const ret = await room.updateConfig({ name: 'test' });
		expect(patch).toBeCalledWith(Context.Room, { name: 'test' });
		expect(ret).toBe(false);
		expect(room.getConfig()).toStrictEqual({ a: 99 });
		patch.mockClear();
	});

	it('modifies configuration unsuccessfully', async () => {
		patch.mockResolvedValueOnce('yes');
		const ret = await room.updateConfig({ name: 'test' });
		expect(patch).toBeCalledWith(Context.Room, { name: 'test' });
		expect(ret).toBe(true);
		expect(room.getConfig()).toStrictEqual({ name: 'test', a: 99 });
	});
});

describe('#fetchConfig()', () => {
	it('loads configuration unsuccessfully', async () => {
		const ret = await room.fetchConfig();
		expect(ret).toBe(false);
		expect(room.getConfig()).toStrictEqual({ name: 'test', a: 99 });
	});

	it('loads configuration successfully', async () => {
		head.mockResolvedValueOnce({ name: 'wow' });
		const ret = await room.fetchConfig();
		expect(ret).toBe(true);
		expect(room.getConfig()).toStrictEqual({ name: 'wow' });
	});
});
