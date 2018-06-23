
import Enum from './Enum';

const net = new Enum(
	// Common commands
	'Invalid',

	'CheckVersion',

	'Login',
	'Logout',

	'CreateRoom',
	'EnterRoom',
	'LeaveRoom',
	'UpdateRoom',

	'SetUserList',
	'AddUser',
	'RemoveUser',

	'Speak',
	'LoadGame',
);

export default net;
