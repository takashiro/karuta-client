import assert from 'assert';

import Packet from '../Packet';

describe('Packet', function () {
	it('creates an invalid packet', function () {
		const packet = new Packet();
		assert(packet.command === 0);
		assert(packet.arguments === null);

		const json = packet.toJSON();
		assert(json === '[0]');
	});

	it('accepts invalid JSON', function () {
		const packet = new Packet('{');
		assert.strictEqual(packet.command, 0);
		assert.strictEqual(packet.arguments, null);
		assert(packet.error);
	});

	it('accepts non-array input', function () {
		const packet = new Packet('{}');
		assert.strictEqual(packet.command, 0);
		assert.strictEqual(packet.arguments, null);
	});

	it('creates a packet', function () {
		const packet = new Packet('[1]');
		assert.strictEqual(packet.command, 1);
		const json = packet.toJSON();
		assert.strictEqual(json, '[1]');
	});

	it('creates a packet with arguments', function () {
		const raw = '[2,34]';
		const packet = new Packet(raw);
		assert(packet.toJSON(), raw);
	});
});
