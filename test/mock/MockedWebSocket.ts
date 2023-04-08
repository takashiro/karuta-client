export default class MockedWebSocket implements WebSocket {
	CONNECTING: 0;

	OPEN: 1;

	CLOSING: 2;

	CLOSED: 3;

	binaryType: BinaryType = 'blob';

	bufferedAmount = 0;

	extensions = '';

	onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;

	onerror: ((this: WebSocket, ev: Event) => any) | null = null;

	onmessage: ((this: WebSocket, ev: MessageEvent<any>) => any) | null = null;

	onopen: ((this: WebSocket, ev: Event) => any) | null = null;

	protocol = '';

	readyState = 0;

	url = '';

	constructor() {
		this.CONNECTING = 0;
		this.OPEN = 1;
		this.CLOSING = 2;
		this.CLOSED = 3;
	}

	close(code?: number | undefined, reason?: string | undefined): void {
		throw new Error('Method not implemented.');
	}

	send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
		throw new Error('Method not implemented.');
	}

	addEventListener(type: unknown, listener: unknown, options?: unknown): void {
		throw new Error('Method not implemented.');
	}

	removeEventListener(type: unknown, listener: unknown, options?: unknown): void {
		throw new Error('Method not implemented.');
	}

	dispatchEvent(event: Event): boolean {
		throw new Error('Method not implemented.');
	}
}
