
function defineEnum() {
	let enums = {};
	for (let i = 0; i < arguments.length; i++) {
		enums[arguments[i]] = i;
	}
	Object.freeze(enums);
	return enums;
}

export default {
	defineEnum,
};
