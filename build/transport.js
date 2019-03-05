"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const ilp_packet_1 = require("ilp-packet");
const verror_1 = require("verror");
const message_1 = require("./message");
exports.DEFAULT_BATCH = 1;
exports.DEFAULT_BATCH_CUTOVER_TIMEOUT_MS = 30 * 1000;
exports.DEFAULT_MAX_TIMEOUT_MS = 5 * 60 * 1000;
class IlpTransport extends events_1.EventEmitter {
    constructor(stream, options) {
        super();
        this._incoming = new Set();
        this._outgoing = new Map();
        this._requestIdsByBatch = new Map();
        this._batch = (options && options.batch)
            ? options.batch
            : exports.DEFAULT_BATCH;
        this._newBatch = this._batch;
        this._minimumBatch = this._batch;
        this._batchCutoverTimeoutMs = (options && options.batchCutoverTimeoutMs)
            ? options.batchCutoverTimeoutMs
            : exports.DEFAULT_BATCH_CUTOVER_TIMEOUT_MS;
        this._maxTimeoutMs = (options && options.maxTimeoutMs)
            ? options.maxTimeoutMs
            : exports.DEFAULT_MAX_TIMEOUT_MS;
        this._stream = stream;
        this._stream.on('error', (error) => {
            this.emit('error', new verror_1.SError(error, 'error in underlying stream.'));
        });
        this._stream.on('data', (message) => {
            this._handleMessage(message);
        });
        if (options && options.handlerProvider) {
            this.handlerProvider = options.handlerProvider;
        }
        else {
            this.handlerProvider = (packet) => {
                return (packet) => {
                    const err = new verror_1.SError('no request handler for incoming request', packet);
                    this.emit('error', err);
                    return Promise.resolve({
                        triggeredBy: (this.address) ? this.address : 'peer',
                        code: ilp_packet_1.Errors.codes.T00_INTERNAL_ERROR,
                        message: '',
                        data: Buffer.allocUnsafe(0)
                    });
                };
            };
        }
    }
    get batch() {
        return this._batch;
    }
    newBatch(batch) {
        if (batch < this._batch) {
            throw new verror_1.SError(`can't reduce batch number from current value of ${this._batch}`);
        }
        if (this._newBatch !== this._batch) {
            throw new verror_1.SError(`a batch cut-over is currently pending to batch ${this._newBatch} ` +
                `and will only cut over when a new request is sent.`);
        }
        this._newBatch = batch;
    }
    request(request, sentCallback) {
        if (!this._stream.writable)
            throw new Error('underlying stream is not writeable');
        const packet = ilp_packet_1.serializeIlpPrepare(request);
        const message = this._nextMessage(packet);
        const key = _requestKey(message);
        const timeoutMs = request.expiresAt.valueOf() - Date.now();
        if (timeoutMs > this._maxTimeoutMs || timeoutMs <= 0) {
            throw new verror_1.SError('invalid expiresAt in ILP packet. timeoutMs=%s, maxTimeoutMs=%s', timeoutMs, this._maxTimeoutMs);
        }
        return new Promise((replyCallback, errorCallback) => {
            const timeout = setTimeout(() => {
                this._outgoing.delete(key);
                errorCallback(new verror_1.SError('timed out waiting for response'));
            }, timeoutMs);
            const respond = (response) => {
                clearTimeout(timeout);
                this._outgoing.delete(key);
                replyCallback(ilp_packet_1.deserializeIlpReply(response));
            };
            this._outgoing.set(key, { respond, timeout });
            this._stream.write(message, sentCallback);
        });
    }
    _nextMessage(payload) {
        if (this._batch !== this._newBatch) {
            this._batch = this._newBatch;
            setTimeout(() => {
                this._minimumBatch = this._batch;
            }, this._batchCutoverTimeoutMs);
        }
        const batch = this._batch;
        const lastId = this._requestIdsByBatch.get(batch);
        const id = (typeof lastId !== 'number') ? 1 : lastId + 1;
        this._requestIdsByBatch.set(batch, id);
        return { batch, id, payload };
    }
    _handleMessage(message) {
        const { batch, id, payload } = message;
        try {
            const key = _requestKey(message);
            if (message_1.isRequestMessage(message)) {
                if (this._incoming.has(key)) {
                    this.emit('error', new verror_1.SError(`duplicate request received for key: ${key}`));
                    return;
                }
                if (batch < this._minimumBatch) {
                    this.emit('error', new verror_1.SError(`request received for closed batch : ${batch}`));
                    return;
                }
                if (batch > this._batch) {
                    if (this._batch === this._newBatch || batch >= this._newBatch) {
                        this._newBatch = batch;
                    }
                    this._batch = batch;
                }
                const packet = ilp_packet_1.deserializeIlpPrepare(payload);
                const handler = this.handlerProvider(packet);
                this._incoming.add(key);
                const timeout = setTimeout(() => {
                    this._incoming.delete(key);
                    this.emit('error', new verror_1.SError('timed out waiting for response from request handler. batch=%s id=%s', batch, id));
                }, packet.expiresAt.getMilliseconds() - new Date().getMilliseconds());
                handler(packet)
                    .then(reply => {
                    clearTimeout(timeout);
                    this._incoming.delete(key);
                    this._stream.write({
                        id,
                        batch,
                        payload: ilp_packet_1.serializeIlpReply(reply)
                    }, (error) => {
                        if (error) {
                            this.emit('error', new verror_1.SError(error, 'error sending fulfill. batch=%s id=%s', batch, id));
                        }
                    });
                })
                    .catch(e => {
                    this._incoming.delete(key);
                    const err = new verror_1.SError(e, 'error handling incoming request. batch=%s id=%s', batch, id);
                    this.emit('error', err);
                    this._stream.write({
                        id,
                        batch,
                        payload: ilp_packet_1.serializeIlpReject({
                            triggeredBy: (this.address) ? this.address : 'peer',
                            code: ilp_packet_1.Errors.codes.T00_INTERNAL_ERROR,
                            message: '',
                            data: Buffer.allocUnsafe(0)
                        })
                    }, (error) => {
                        if (error) {
                            this.emit('error', new verror_1.SError(error, 'error sending reject. batch=%s id=%s', batch, id));
                        }
                    });
                });
            }
            else {
                const request = this._outgoing.get(key);
                if (!request) {
                    this.emit('error', new verror_1.SError('unsolicited response message received: %s', message));
                }
                else {
                    request.respond(payload);
                }
            }
        }
        catch (e) {
            this.emit('error', new verror_1.SError(e, 'error handling message. batch=%s id=%s', batch, id));
        }
    }
}
exports.IlpTransport = IlpTransport;
function _requestKey(message) {
    const arr = new ArrayBuffer(8);
    const view = new DataView(arr);
    view.setUint32(0, message.batch, false);
    view.setUint32(4, message.id, false);
    return view.getFloat64(0);
}
//# sourceMappingURL=transport.js.map