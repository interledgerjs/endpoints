"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const message_stream_1 = require("./message-stream");
exports.DEFAULT_MAX_TIMEOUT_MS = 5 * 60 * 1000;
class StreamEndpoint extends stream_1.Duplex {
    constructor(codecs, options) {
        super({
            allowHalfOpen: false,
            read: () => {
                this._outgoingMessageStream.resume();
            },
            write: (chunk, encoding, callback) => {
                this._incomingMessageStream.write(chunk, encoding, callback);
            }
        });
        this._isRequest = codecs.isRequest;
        this._isMessageFrame = codecs.isMessage;
        this._incoming = new Set();
        this._outgoing = new Map();
        if (options && options.nextRequestId) {
            this._nextRequestId = options.nextRequestId;
            if (this._nextRequestId > 0xffffffff) {
                this._nextRequestId = 1;
            }
        }
        else {
            this._nextRequestId = 1;
        }
        this._maxTimeoutMs = (options && options.maxTimeoutMs)
            ? options.maxTimeoutMs
            : exports.DEFAULT_MAX_TIMEOUT_MS;
        this._outgoingMessageStream = new message_stream_1.MessageEncoder(codecs.encode, codecs.isMessage);
        this._outgoingMessageStream.on('error', (error) => {
            this.emit('error', error);
        });
        this._outgoingMessageStream.on('data', (chunk) => {
            if (!this.push(chunk)) {
                this._outgoingMessageStream.pause();
            }
        });
        this._incomingMessageStream = new message_stream_1.MessageDecoder(codecs.decode, codecs.isMessage);
        this._incomingMessageStream.on('error', (error) => {
            this.emit('error', error);
        });
        this._incomingMessageStream.on('data', async (message) => {
            return this._handleMessage(message);
        });
        if (options && options.handler) {
            this._incomingRequestHandler = options.handler;
        }
        else {
            this._incomingRequestHandler = (packet) => {
                throw new Error('no request handler for incoming request');
            };
        }
    }
    sendOutgoingRequest(request, sentCallback) {
        if (!this._outgoingMessageStream.writable)
            throw new Error('underlying stream is not writeable');
        const message = this._nextMessage(request);
        const timeoutMs = request.expiresAt.valueOf() - Date.now();
        if (timeoutMs > this._maxTimeoutMs || timeoutMs <= 0) {
            throw new Error(`invalid expiresAt in ILP packet. timeoutMs=${timeoutMs}, maxTimeoutMs=${this._maxTimeoutMs}`);
        }
        return new Promise((replyCallback, errorCallback) => {
            const timeout = setTimeout(() => {
                this._outgoing.delete(message.id);
                errorCallback(new Error('timed out waiting for response'));
            }, timeoutMs);
            const respond = (reply) => {
                clearTimeout(timeout);
                this._outgoing.delete(message.id);
                replyCallback(reply);
            };
            this._outgoing.set(message.id, { respond, timeout });
            this._outgoingMessageStream.write(message, sentCallback);
        });
    }
    setIncomingRequestHandler(handler) {
        this._incomingRequestHandler = handler;
        return this;
    }
    _nextMessage(payload) {
        const id = this._nextRequestId++;
        if (this._nextRequestId > 0xffffffff) {
            this._nextRequestId = 1;
        }
        return { id, payload };
    }
    async _handleMessage(message) {
        const { id, payload } = message;
        try {
            if (this._isRequest(payload)) {
                if (this._incoming.has(id)) {
                    this.emit('error', new Error(`duplicate request received for id: ${id}`));
                    return;
                }
                this._incoming.add(id);
                try {
                    const reply = await (async () => {
                        const timeout = setTimeout(() => {
                            throw new Error(`timed out waiting for response from request handler. id=${id}`);
                        }, payload.expiresAt.getMilliseconds() - new Date().getMilliseconds());
                        const reply = await this._incomingRequestHandler(payload);
                        clearTimeout(timeout);
                        return reply;
                    })();
                    this._incomingMessageStream.write({ id, payload: reply }, (error) => {
                        if (error) {
                            this.emit('error', error);
                        }
                    });
                }
                catch (e) {
                    this.emit('error', e);
                }
                finally {
                    this._incoming.delete(id);
                }
            }
            else {
                const request = this._outgoing.get(id);
                if (!request) {
                    this.emit('error', new Error('unsolicited response message received: ' + JSON.stringify(message)));
                }
                else {
                    request.respond(payload);
                }
            }
        }
        catch (e) {
            this.emit('error', e);
        }
    }
}
exports.StreamEndpoint = StreamEndpoint;
//# sourceMappingURL=stream-endpoint.js.map