import Client from '../lib/Client';

describe('Client', () => {
	describe('#setUrl()', () => {
		const client = new Client();

		it('accepts absolute path', () => {
			const exampleUrl = 'http://www.example.com';
			client.setUrl(exampleUrl);
			expect(client.getUrl()).toBe(exampleUrl);
		});

		it('resets URL', () => {
			client.setUrl(null);
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
			const hasError = new Promise(((resolve) => {
				client.once('error', resolve);
			}));

			expect.assertions(2);
			try {
				await client.connect('localhost');
			} catch (error) {
				expect(error.message).toBe('WebSocket is not defined');
			}
			const errorMessage = await hasError;
			expect(errorMessage).toBe('WebSocket is not defined');
		});

		it('fails when WebSocket is closed', async () => {
			global.WebSocket = function () {};
			WebSocket.prototype.onclose = null;

			const client = new Client();
			const onClose = new Promise((resolve) => {
				client.once('close', resolve);
			});
			setTimeout(() => {
				client.socket.onclose();
			}, 0);
			expect.assertions(1);
			try {
				await client.connect('localhost');
			} catch (error) {
				expect(error.message).toBe('WebSocket is closed.');
			}
			await onClose;

			delete global.WebSocket;
		});

		const client = new Client();

		it('succeeds when WebSocket is opened', async () => {
			global.WebSocket = function () {};
			WebSocket.prototype.onopen = null;

			const onOpen = new Promise((resolve) => {
				client.once('open', resolve);
			});
			setTimeout(() => {
				client.socket.onopen();
			}, 0);
			await Promise.all([
				onOpen,
				client.connect('localhost'),
			]);

			delete global.WebSocket;
		});

		it('binds WebSocket onmessage', () => {
			client.trigger = jest.fn();
			client.socket.onmessage({ data: '[1]' });
			expect(client.trigger).toBeCalledWith(1, undefined);
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
			client.socket = socket;
			setTimeout(() => {
				client.emit('close');
			}, 0);
			await client.disconnect();
			expect(socket.close).toBeCalledTimes(1);
			expect(client.connected).toBe(false);
			expect(client.socket).toBeNull();
		});
	});

	describe('#connected', () => {
		const client = new Client();
		it('is disconnected', () => {
			expect(client.connected).toBe(false);
		});
		it('is connected', () => {
			global.WebSocket = {
				OPEN: String(Math.random()),
			};
			client.socket = {
				readyState: WebSocket.OPEN,
			};
			expect(client.connected).toBe(true);
			delete global.WebSocket;
		});
	});

	describe('#state', () => {
		const client = new Client();
		it('is connecting', () => {
			global.WebSocket = {
				CONNECTING: String(Math.random()),
			};
			expect(client.state).toBe(WebSocket.CONNECTING);
			delete global.WebSocket;
		});
		it('returns web socket state', () => {
			client.socket = {
				readyState: String(Math.random()),
			};
			expect(client.state).toBe(client.socket.readyState);
		});
	});

	describe('#send()', () => {
		const client = new Client();
		const socket = {
			send: jest.fn(),
		};
		client.socket = socket;

		it('sends JSON', () => {
			client.send(1234, [1, 2, 3, 4]);
			expect(socket.send).toBeCalledTimes(1);
			expect(socket.send).toBeCalledWith('[1234,[1,2,3,4]]');
			socket.send.mockClear();
		});

		it('accepts 1 argument', () => {
			client.send(678);
			expect(socket.send).toBeCalledTimes(1);
			expect(socket.send).toBeCalledWith('[678]');
			socket.send.mockClear();
		});
	});

	describe('#request()', () => {
		const client = new Client();
		const socket = {
			send: jest.fn(),
		};
		client.socket = socket;

		it('sends a command and waits for a reply', async () => {
			const key = String(Math.random());
			setTimeout(() => {
				client.trigger(4321, key);
			}, 0);
			const reply = await client.request(4321);
			expect(socket.send).toBeCalledTimes(1);
			expect(socket.send).toBeCalledWith('[4321]');
			expect(reply).toBe(key);
		});
	});

	describe('#trigger()', () => {
		const client = new Client();

		it('does nothing when no handler is bound', () => {
			client.trigger(1234);
		});

		it('triggers events', () => {
			const callback1 = jest.fn();
			client.bind(1, callback1);

			const callback2 = jest.fn();
			client.bind(1, callback2, { once: true });

			const callback3 = jest.fn();
			client.bind(2, callback3);

			const callback4 = jest.fn();
			client.bind(1, callback4);

			const key1 = String(Math.random());
			client.trigger(1, key1);

			const key2 = String(Math.random());
			client.trigger(1, key2);

			expect(callback1).toBeCalledTimes(2);
			expect(callback1).nthCalledWith(1, key1);
			expect(callback1).nthCalledWith(2, key2);
			expect(callback2).toBeCalledTimes(1);
			expect(callback2).toBeCalledWith(key1);
			expect(callback3).toBeCalledTimes(0);
			expect(callback4).toBeCalledTimes(2);
			expect(callback4).nthCalledWith(1, key1);
			expect(callback4).nthCalledWith(2, key2);
		});
	});

	describe('#unbind()', () => {
		const client = new Client();

		it('does nothing if the command does not exist', () => {
			client.unbind(6789, 1);
			client.unbind(1234);
		});

		it('unbinds all listeners', () => {
			const callback = jest.fn();
			client.bind(1, 1);
			client.bind(1, 2);
			client.bind(1, callback);
			client.unbind(1);
			client.trigger(1);
			expect(callback).not.toBeCalled();
		});

		it('unbinds one listener', () => {
			const callback1 = jest.fn();
			client.bind(4, callback1);
			const callback2 = 333;
			client.bind(4, callback2);
			const callback3 = jest.fn();
			client.bind(4, callback3);
			const callback4 = jest.fn();
			client.bind(4, callback4);

			client.unbind(4, callback2);
			client.unbind(4, callback3);

			client.trigger(4, 'test');
			expect(callback1).toBeCalledTimes(1);
			expect(callback1).toBeCalledWith('test');
			expect(callback3).not.toBeCalled();
			expect(callback4).toBeCalledTimes(1);
			expect(callback4).toBeCalledWith('test');
		});
	});

	describe('#reply()', () => {
		const client = new Client();
		const socket = {
			send: jest.fn(),
		};
		client.socket = socket;

		client.bind(456, jest.fn());
		client.bind(457, jest.fn());

		afterEach(() => {
			socket.send.mockClear();
		});

		it('replies to the current command', () => {
			client.trigger(456);
			const locker = client.lock();
			const res = client.reply(locker, 789);
			expect(res).toBe(true);
			expect(socket.send).toBeCalledTimes(1);
			expect(socket.send).toBeCalledWith('[456,789]');
		});

		it('will not reply if a new command comes', () => {
			const locker = client.lock();
			client.trigger(457);
			expect(client.reply(locker)).toBe(false);
			expect(socket.send).not.toBeCalled();
		});

		it('will not reply if a new locker exists', () => {
			const locker1 = client.lock();
			const locker2 = client.lock();
			expect(client.reply(locker1)).toBe(false);
			expect(client.reply(locker2)).toBe(true);
			expect(socket.send).toBeCalledTimes(1);
			expect(socket.send).toBeCalledWith('[457]');
		});
	});
});
