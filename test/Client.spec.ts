import {
	Connection,
	Context,
	Method,
} from '@karuta/core';

import MockedWebSocket from './mock/MockedWebSocket';
import Client from '../src/Client';

jest.mock('@karuta/core');
jest.mock('./mock/MockedWebSocket');

const port = 10000 + Math.floor(Math.random() * (0xFFFF - 10000));

const client = new Client();

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
		Reflect.set(global, 'WebSocket', MockedWebSocket);
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
	let socket: jest.Mocked<Connection>;

	beforeAll(() => {
		socket = Reflect.get(client, 'socket');
	});

	it('sends a GET request', async () => {
		await client.get(Context.Message, 'Hi, Takashiro.');
		expect(socket.get).toBeCalledWith(Context.Message, 'Hi, Takashiro.');
	});

	it('sends a HEAD request', async () => {
		await client.head(Context.Version, 'v7');
		expect(socket.head).toBeCalledWith(Context.Version, 'v7');
	});

	it('sends a POST request', async () => {
		await client.post(Context.Driver, 'jest');
		expect(socket.post).toBeCalledWith(Context.Driver, 'jest');
	});

	it('sends a DELETE request', async () => {
		await client.delete(Context.UserSession, false);
		expect(socket.delete).toBeCalledWith(Context.UserSession, false);
	});

	it('sends a PUT request', async () => {
		await client.put(Context.UserSession, { username: 'me' });
		expect(socket.put).toBeCalledWith(Context.UserSession, { username: 'me' });
	});

	it('sends a PATCH request', async () => {
		await client.patch(Context.Room, 123);
		expect(socket.patch).toBeCalledWith(Context.Room, 123);
	});

	it('sends a custom request', async () => {
		await client.request(Method.Patch, Context.Room, 123);
		expect(socket.request).toBeCalledWith(Method.Patch, Context.Room, 123);
	});

	it('sends a notification', () => {
		client.notify(Method.Post, Context.Message, 'Aloha!');
		expect(socket.notify).toBeCalledWith(Method.Post, Context.Message, 'Aloha!');
	});

	it('binds a context listener', async () => {
		const post = jest.fn();
		client.on({
			context: Context.Message,
			post,
		});
		expect(socket.on).toBeCalledWith({
			context: Context.Message,
			post,
		});
	});
});

describe('#checkVersion()', () => {
	it('checks server version', async () => {
		const get = jest.spyOn(client, 'get');
		await client.checkVersion();
		expect(get).toBeCalledWith(Context.Version);
		get.mockRestore();
	});
});

describe('#login()', () => {
	let socket: jest.Mocked<Connection>;

	beforeAll(() => {
		socket = Reflect.get(client, 'socket');
	});

	it('sends name', async () => {
		await client.login('takashiro');
		expect(socket.post).toBeCalledWith(Context.UserSession, { name: 'takashiro' });
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
			// waitFor(Context.UserSession, 'delete'),
			client.logout(),
		]);
		expect(msg).toBeUndefined();
		expect(client.getUid()).toBe(0);
	});
});
