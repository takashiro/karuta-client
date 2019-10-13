import assert from 'assert';
import cmd from '../cmd';

describe('cmd', function () {
	it('has numeric properties only', function () {
		for (const name of Object.keys(cmd)) {
			const value = cmd[name];
			assert.strictEqual(typeof value, 'number');
		}
	});
});
