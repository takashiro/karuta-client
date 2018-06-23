
function defineEnum() {
	let enums = {};
	for (let i = 0; i < arguments.length; i++) {
		enums[arguments[i]] = i;
	}

	let numMap = arguments;
	enums.fromNum = function (num) {
		if (num >= 0 && num < numMap.length) {
			return numMap[num];
		}
	};

	Object.freeze(enums);
	return enums;
}

export default {
	defineEnum,
};
