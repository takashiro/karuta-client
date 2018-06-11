
class Packet {

	/**
	 * Construct a network packet with JSON string representation
	 * @param {object} data
	 */
	constructor(data = null){
		this.command = 0;
		this.arguments = null;
		if (data) {
			try {
				data = JSON.parse(data);
				if (data instanceof Array) {
					this.command = data[0];
					this.arguments = data[1];
				}
			} catch (error) {
				alert(error);
			}
		}
	}

	/**
	 * Convert a network packet into JSON string representation
	 * @return {string} JSON string
	 */
	toJSON(){
		let json = [this.command];
		if (this.arguments !== undefined && this.arguments !== null) {
			json.push(this.arguments);
		}
		return JSON.stringify(json);
	}

}

export default Packet;
