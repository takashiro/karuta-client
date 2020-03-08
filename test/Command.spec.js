import Command from '../lib/Command';

describe('Command', () => {
	it('has numeric properties only', () => {
		expect(Command.Invalid).toBe(0);
	});
});
