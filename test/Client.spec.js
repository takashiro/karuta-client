import assert from 'assert';
import sinon from 'sinon';

import Client from '../Client';

describe('Client', function () {
	describe('#setUrl()', function () {
		const client = new Client();

		it('accepts absolute path', function () {
			const exampleUrl = 'http://www.example.com';
			client.setUrl(exampleUrl);
			assert.strictEqual(client.url, exampleUrl);
		});

		it('resets URL', function () {
			client.setUrl(null);
			assert.strictEqual(client.url, '');
		});

		it('accepts hostname only', function () {
			client.setUrl('example');
			assert.strictEqual(client.url, 'ws://example:2610/');
		});

		it('accepts hostname with context path', function () {
			client.setUrl('example.com/test');
			assert.strictEqual(client.url, 'ws://example.com:2610/test');
		});

		it('accepts hostname with port number', function () {
			client.setUrl('localhost:2620');
			assert.strictEqual(client.url, 'ws://localhost:2620/');
		});
	});

	describe('#connect()', function () {
		it('refuses void parameter', async function () {
			const client = new Client();
			try {
				await client.connect();
				assert.fail('No error is thrown');
			} catch (error) {
				assert.strictEqual(error.message, 'No url is defined.');
			}
		});

		it('fails if WebSocket cannot be created', async function () {
			const client = new Client();
			const hasError = new Promise(function (resolve) {
				client.once('error', resolve);
			});
			try {
				await client.connect('localhost');
				assert.fail('No error is thrown');
			} catch (error) {
				assert.strictEqual(error.message, 'WebSocket is not defined');
			}
			const errorMessage = await hasError;
			assert.strictEqual(errorMessage, 'WebSocket is not defined');
		});

		it('fails when WebSocket is closed', async function () {
			global.WebSocket = function () {};
			WebSocket.prototype.onclose = null;

			const client = new Client();
			const onClose = new Promise(function (resolve) {
				client.once('close', resolve);
			});
			setTimeout(function () {
				client.socket.onclose();
			}, 0);
			try {
				await client.connect('localhost');
				assert.fail('No error is thrown even websocket is closed.');
			} catch (error) {
				assert.strictEqual(error.message, 'WebSocket is closed.');
			}
			await onClose;

			delete global.WebSocket;
		});

		const client = new Client();

		it('succeeds when WebSocket is opened', async function () {
			global.WebSocket = function () {};
			WebSocket.prototype.onopen = null;

			const onOpen = new Promise(function (resolve) {
				client.once('open', resolve);
			});
			setTimeout(function () {
				client.socket.onopen();
			}, 0);
			await Promise.all([
				onOpen,
				client.connect('localhost'),
			]);

			delete global.WebSocket;
		});

		it('binds WebSocket onmessage', function () {
			client.trigger = sinon.spy();
			client.socket.onmessage({ data: '[1]' });
			assert(client.trigger.calledOnceWith(1));
		});
	});

	describe('#disconnect()', function () {
		const client = new Client();

		it('does nothing if no socket exists', async function () {
			await client.disconnect();
		});

		it('closes and removes web socket', async function () {
			const socket = {
				close: sinon.spy(),
			};
			client.socket = socket;
			setTimeout(function () {
				client.emit('close');
			}, 0);
			await client.disconnect();
			assert(socket.close.calledOnceWith());
			assert.strictEqual(client.connected, false);
			assert.strictEqual(client.socket, null);
		});
	});

	describe('#connected', function () {
		const client = new Client();
		it('is disconnected', function () {
			assert.strictEqual(client.connected, false);
		});
		it('is connected', function () {
			global.WebSocket = {
				OPEN: String(Math.random()),
			};
			client.socket = {
				readyState: WebSocket.OPEN,
			};
			assert.strictEqual(client.connected, true);
			delete global.WebSocket;
		});
	});

	describe('#state', function () {
		const client = new Client();
		it('is connecting', function () {
			global.WebSocket = {
				CONNECTING: String(Math.random()),
			};
			assert.strictEqual(client.state, WebSocket.CONNECTING);
			delete global.WebSocket;
		});
		it('returns web socket state', function () {
			client.socket = {
				readyState: String(Math.random()),
			};
			assert.strictEqual(client.state, client.socket.readyState);
		});
	});

	describe('#send()', function () {
		const client = new Client();
		const socket = {
			send: sinon.spy(),
		};
		client.socket = socket;

		it('sends JSON', function () {
			client.send(1234, [1, 2, 3, 4]);
			assert(socket.send.calledOnceWith('[1234,[1,2,3,4]]'));
			socket.send.resetHistory();
		});

		it('accepts 1 argument', function () {
			client.send(678);
			assert(socket.send.calledOnceWith('[678]'));
			socket.send.resetHistory();
		});
	});

	describe('#request()', function () {
		const client = new Client();
		const socket = {
			send: sinon.spy(),
		};
		client.socket = socket;

		it('sends a command and waits for a reply', async function () {
			const key = String(Math.random());
			setTimeout(function () {
				client.trigger(4321, key);
			}, 0);
			const reply = await client.request(4321);
			assert(socket.send.calledOnceWith('[4321]'));
			assert(reply === key);
		});
	});

	describe('#trigger()', function () {
		const client = new Client();

		it('does nothing when no handler is bound', function () {
			client.trigger(1234);
		});

		it('triggers events', function () {
			const callback1 = sinon.spy();
			client.bind(1, callback1);

			const callback2 = sinon.spy();
			client.bind(1, callback2, { once: true });

			const callback3 = sinon.spy();
			client.bind(2, callback3);

			const callback4 = sinon.spy();
			client.bind(1, callback4);

			const key1 = String(Math.random());
			client.trigger(1, key1);

			const key2 = String(Math.random());
			client.trigger(1, key2);

			assert.strictEqual(callback1.callCount, 2);
			assert(callback1.firstCall.calledWithExactly(key1));
			assert(callback1.secondCall.calledWithExactly(key2));
			assert(callback2.calledOnceWithExactly(key1));
			assert.strictEqual(callback3.callCount, 0);
			assert.strictEqual(callback4.callCount, 2);
			assert(callback4.firstCall.calledWithExactly(key1));
			assert(callback4.secondCall.calledWithExactly(key2));
		});
	});

	describe('#unbind()', function () {
		const client = new Client();

		it('does nothing if the command does not exist', function () {
			client.unbind(6789, 1);
			client.unbind(1234);
		});

		it('unbinds all listeners', function () {
			const callback = sinon.spy();
			client.bind(1, 1);
			client.bind(1, 2);
			client.bind(1, callback);
			client.unbind(1);
			client.trigger(1);
			assert.strictEqual(callback.callCount, 0);
		});

		it('unbinds one listener', function () {
			const callback1 = sinon.spy();
			client.bind(4, callback1);
			const callback2 = 333;
			client.bind(4, callback2);
			const callback3 = sinon.spy();
			client.bind(4, callback3);
			const callback4 = sinon.spy();
			client.bind(4, callback4);

			client.unbind(4, callback2);
			client.unbind(4, callback3);

			client.trigger(4, 'test');
			assert(callback1.calledOnceWith('test'));
			assert.strictEqual(callback3.callCount, 0);
			assert(callback4.calledOnceWith('test'));
		});
	});

	describe('#reply()', function () {
		const client = new Client();
		const socket = {
			send: sinon.spy(),
		};
		client.socket = socket;

		client.bind(456, sinon.fake());
		client.bind(457, sinon.fake());

		it('replies to the current command', function () {
			client.trigger(456);
			const locker = client.lock();
			const res = client.reply(locker, 789);
			assert.strictEqual(res, true);
			assert(socket.send.calledOnceWith('[456,789]'));
			socket.send.resetHistory();
		});

		it('will not reply if a new command comes', function () {
			const locker = client.lock();
			client.trigger(457);
			assert.strictEqual(client.reply(locker), false);
			assert.strictEqual(socket.send.callCount, 0);
		});

		it('will not reply if a new locker exists', function () {
			const locker1 = client.lock();
			const locker2 = client.lock();
			assert.strictEqual(client.reply(locker1), false);
			assert.strictEqual(client.reply(locker2), true);
			assert(socket.send.calledOnceWithExactly('[457]'));
			socket.send.resetHistory();
		});
	});
});
