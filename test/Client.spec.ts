import Client from '../src/Client';

describe('#setUrl()', () => {
	const client = new Client();

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
		const client = new Client();

		expect.assertions(1);
		try {
			await client.connect();
		} catch (error) {
			expect(error.message).toBe('No url is defined.');
		}
	});

	it('fails if WebSocket cannot be created', async () => {
		const client = new Client();

		expect.assertions(1);
		try {
			await client.connect('localhost');
		} catch (error) {
			expect(error.message).toBe('WebSocket is not defined');
		}
	});
});

describe('#disconnect()', () => {
	const client = new Client();

	it('does nothing if no socket exists', async () => {
		await client.disconnect();
	});

	it('closes and removes web socket', async () => {
		const socket = {
			close: jest.fn(),
		};
		Reflect.set(client, 'socket', socket);
		await client.disconnect();
		expect(socket.close).toBeCalledTimes(1);
		expect(client.isConnected()).toBe(false);
	});
});

describe('#isConnected()', () => {
	const client = new Client();

	it('is disconnected', () => {
		expect(client.isConnected()).toBe(false);
	});
});

describe('#logout()', () => {
	const client = new Client();
	const disconnect = jest.spyOn(client, 'disconnect').mockResolvedValue();

	it('does nothing if it is not connected', () => {
		client.logout();
		expect(disconnect).not.toBeCalled();
	});
});
