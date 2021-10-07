import WebSocket, {
	Server,
} from 'ws';

import {
	Context,
	Connection,
	Method,
} from '@karuta/core';

import Client from '../src/Client';

const port = 10000 + Math.floor(Math.random() * (0xFFFF - 10000));
const server = new Server({
	port,
});

let peer: Connection;
server.on('connection', (socket) => {
	peer = new Connection(socket);
});

function waitFor(context: number, callback: string): Promise<unknown> {
	return new Promise((resolve) => {
		peer.on({
			context,
			[callback]: resolve,
		});
	});
}

const client = new Client();

afterAll(() => {
	server.close();
});

describe('#setUrl()', () => {
	it('accepts absolute path', () => {
		const exampleUrl = 'http://www.example.com';
		client.setUrl(exampleUrl);
		expect(client.getUrl()).toBe(exampleUrl);
	});

	it('resets URL', () => {
		client.setUrl();
		expect(client.getUrl()).toBe('');
	});

	it('accepts hostname only', () => {
		client.setUrl('example');
		expect(client.getUrl()).toBe('ws://example:2610/');
	});

	it('accepts hostname with context path', () => {
		client.setUrl('example.com/test');
		expect(client.getUrl()).toBe('ws://example.com:2610/test');
	});

	it('accepts hostname with port number', () => {
		client.setUrl('localhost:2620');
		expect(client.getUrl()).toBe('ws://localhost:2620/');
	});
});

describe('#connect()', () => {
	it('refuses void parameter', async () => {
		const me = new Client();
		await expect(() => me.connect()).rejects.toThrowError('No url is defined.');
	});

	it('fails if WebSocket cannot be created', () => {
		expect(() => client.connect('localhost')).toThrowError('WebSocket is not defined');
	});

	it('connects to a localhost endpoint', async () => {
		Reflect.set(global, 'WebSocket', WebSocket);
		await client.connect(`ws://localhost:${port}`);
		expect(client.getSocket()).toBeTruthy();
		expect(client.getState()).toBe(WebSocket.OPEN);
		expect(client.isConnected()).toBe(true);
	});
});

describe('#disconnect()', () => {
	it('does nothing if no socket exists', async () => {
		const me = new Client();
		expect(me.getState()).toBe(WebSocket.CONNECTING);
		await me.disconnect();
		expect(me.getState()).toBe(WebSocket.CONNECTING);
	});

	it('closes and removes web socket', async () => {
		const socket = {
			close: jest.fn(),
		};
		const me = new Client();
		Reflect.set(me, 'socket', socket);
		await me.disconnect();
		expect(socket.close).toBeCalledTimes(1);
		expect(me.isConnected()).toBe(false);
	});
});

describe('Request / Notification', () => {
	it('sends a GET request', async () => {
		const [msg] = await Promise.all([
			waitFor(Context.Message, 'get'),
			client.get(Context.Message, 'Hi, Takashiro.'),
		]);
		expect(msg).toBe('Hi, Takashiro.');
	});

	it('sends a HEAD request', async () => {
		const [msg] = await Promise.all([
			waitFor(Context.Version, 'head'),
			client.head(Context.Version, 'v7'),
		]);
		expect(msg).toBe('v7');
	});

	it('sends a POST request', async () => {
		const [msg] = await Promise.all([
			waitFor(Context.Driver, 'post'),
			client.post(Context.Driver, 'jest'),
		]);
		expect(msg).toBe('jest');
	});

	it('sends a DELETE request', async () => {
		const [msg] = await Promise.all([
			waitFor(Context.UserSession, 'delete'),
			client.delete(Context.UserSession, false),
		]);
		expect(msg).toBe(false);
	});

	it('sends a PUT request', async () => {
		const [msg] = await Promise.all([
			waitFor(Context.UserSession, 'put'),
			client.put(Context.UserSession, { username: 'me' }),
		]);
		expect(msg).toStrictEqual({ username: 'me' });
	});

	it('sends a PATCH request', async () => {
		const [msg] = await Promise.all([
			waitFor(Context.Room, 'patch'),
			client.patch(Context.Room, 123),
		]);
		expect(msg).toBe(123);
	});

	it('sends a custom request', async () => {
		const [msg] = await Promise.all([
			waitFor(Context.Room, 'patch'),
			client.request(Method.Patch, Context.Room, 123),
		]);
		expect(msg).toBe(123);
	});

	it('sends a notification', async () => {
		const [msg] = await Promise.all([
			waitFor(Context.Message, 'post'),
			client.notify(Method.Post, Context.Message, 'Aloha!'),
		]);
		expect(msg).toBe('Aloha!');
	});

	it('binds a context listener', async () => {
		const post = jest.fn();
		client.on({
			context: Context.Message,
			post,
		});
		await peer.post(Context.Message, 'This is a test.');
		expect(post).toBeCalledWith('This is a test.');
	});
});

describe('#checkVersion()', () => {
	it('checks server version', async () => {
		await Promise.all([
			waitFor(Context.Version, 'get'),
			client.checkVersion(),
		]);
	});
});

describe('#login()', () => {
	it('sends name', async () => {
		const [credential] = await Promise.all([
			waitFor(Context.UserSession, 'post'),
			client.login('takashiro'),
		]);
		expect(credential).toStrictEqual({ name: 'takashiro' });
	});
});

describe('#logout()', () => {
	it('does nothing if it is not connected', async () => {
		const me = new Client();
		const disconnect = jest.spyOn(me, 'disconnect').mockResolvedValue();
		await me.logout();
		expect(disconnect).not.toBeCalled();
	});

	it('deletes its user session and disconnect', async () => {
		const [msg] = await Promise.all([
			waitFor(Context.UserSession, 'delete'),
			client.logout(),
		]);
		expect(msg).toBeUndefined();
		expect(client.getUid()).toBe(0);
	});
});

describe('Error Handling', () => {
	it('does nothing in disconnected state', async () => {
		await client.get(1, 2);
		await client.post(2, 3);
		await client.head(3, 4);
		await client.patch(4, 5);
		await client.put(5, 6);
		await client.delete(6, 7);
		await client.request(10, 20);
		client.notify(10, 21);
	});

	it('cannot bind listeners in disconnected state', () => {
		client.on({ context: 77 });
	});
});
