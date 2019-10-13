
class Packet {
	/**
	 * Construct a network packet with JSON string representation
	 * @param {object} data
	 */
	constructor(data = null) {
		this.command = 0;
		this.arguments = null;
		if (data) {
			try {
				const params = JSON.parse(data);
				if (params instanceof Array) {
					[this.command, this.arguments] = params;
				}
			} catch (error) {
				this.error = error;
			}
		}
	}

	/**
	 * Convert a network packet into JSON string representation
	 * @return {string} JSON string
	 */
	toJSON() {
		const json = [this.command];
		if (this.arguments !== undefined && this.arguments !== null) {
			json.push(this.arguments);
		}
		return JSON.stringify(json);
	}
}

export default Packet;
