
import net from './protocol';

function defineCommand() {
	let commands = Object.assign({}, net);
	for (let i = 0; i < arguments.length; i++) {
		commands[arguments[i]] = net.CommandCount + i;
	}
	Object.freeze(commands);
	return commands;
}

export default defineCommand;
