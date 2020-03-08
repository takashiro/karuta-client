
export default class Packet {
	command: number;

	arguments?: object;

	timeout?: number;

	error?: Error;

	/**
	 * Construct a network packet with JSON string representation
	 * @param {string} data
	 */
	constructor(data?: string) {
		this.command = 0;
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
	 */
	toJSON(): string {
		const json: (number | object)[] = [this.command];
		if (this.arguments !== undefined && this.arguments !== null) {
			json.push(this.arguments);
		}
		return JSON.stringify(json);
	}
}
