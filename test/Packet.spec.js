import Packet from '../lib/Packet';

describe('Packet', () => {
	it('creates an invalid packet', () => {
		const packet = new Packet();
		expect(packet.command).toBe(0);
		expect(packet.arguments).toBeUndefined();
		expect(packet.toJSON()).toBe('[0]');
	});

	it('accepts invalid JSON', () => {
		const packet = new Packet('{');
		expect(packet.command).toBe(0);
		expect(packet.arguments).toBeUndefined();
		expect(packet.error).toBeInstanceOf(Error);
	});

	it('accepts non-array input', () => {
		const packet = new Packet('{}');
		expect(packet.command).toBe(0);
		expect(packet.arguments).toBeUndefined();
	});

	it('creates a packet', () => {
		const packet = new Packet('[1]');
		expect(packet.command).toBe(1);
		expect(packet.toJSON()).toBe('[1]');
	});

	it('creates a packet with arguments', () => {
		const raw = '[2,34]';
		const packet = new Packet(raw);
		expect(packet.toJSON()).toBe(raw);
	});
});
