"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const http = require("http2");
const ilp_packet_1 = require("ilp-packet");
const verror_1 = require("verror");
exports.DEFAULT_MAX_TIMEOUT_MS = 5 * 60 * 1000;
class IlpHttpEndpoint extends events_1.EventEmitter {
    constructor(options) {
        super();
        this._maxTimeoutMs = (options && options.maxTimeoutMs)
            ? options.maxTimeoutMs
            : exports.DEFAULT_MAX_TIMEOUT_MS;
        const createServer = options.serverOptions.secure ? http.createSecureServer : http.createServer;
        this._server = createServer(options.serverOptions, this._handleRequest.bind(this));
        this._server.on('sessionError', (error) => {
            this.emit('error', new verror_1.SError('error in underlying session', error));
        });
        this._client = http.connect(options.peerUrl, options.clientOptions);
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
    request(request, sentCallback) {
        if (!this._client)
            throw new Error('underlying stream is not writeable');
        const timeoutMs = request.expiresAt.valueOf() - Date.now();
        if (timeoutMs > this._maxTimeoutMs || timeoutMs <= 0) {
            throw new verror_1.SError('invalid expiresAt in ILP packet. timeoutMs=%s, maxTimeoutMs=%s', timeoutMs, this._maxTimeoutMs);
        }
        return new Promise(async (replyCallback, errorCallback) => {
            const timeout = setTimeout(() => {
                errorCallback(new verror_1.SError('timed out waiting for response'));
            }, timeoutMs);
            try {
                const reply = await writeIlpHttpRequest(this._client, request, sentCallback);
                clearTimeout(timeout);
                replyCallback(reply);
            }
            catch (e) {
                errorCallback(e);
            }
        });
    }
    _handleRequest(request, response) {
        readIlpHttpRequest(request)
            .then(async (prepare) => {
            const handler = this.handlerProvider(prepare);
            let timedOut = false;
            const timeout = setTimeout(() => {
                this.emit('error', new verror_1.SError('timed out waiting for response from request handler. packet=%s', prepare));
                timedOut = true;
            }, prepare.expiresAt.valueOf() - Date.now());
            handler(prepare)
                .then(reply => {
                if (timedOut) {
                    this.emit('error', new verror_1.SError('didn\'t send fulfill as prepare had already timed out. packet=%s', reply));
                }
                else {
                    clearTimeout(timeout);
                    try {
                        writeIlpHttpResponse(response, reply);
                    }
                    catch (e) {
                        this.emit('error', new verror_1.SError(e, 'error sending fulfill. packet=%s', reply));
                    }
                }
            })
                .catch(e => {
                const err = new verror_1.SError(e, 'error handling incoming request. packet=%', prepare);
                this.emit('error', err);
                const reply = {
                    triggeredBy: (this.address) ? this.address : 'peer',
                    code: ilp_packet_1.Errors.codes.T00_INTERNAL_ERROR,
                    message: '',
                    data: Buffer.allocUnsafe(0)
                };
                try {
                    writeIlpHttpResponse(response, reply);
                }
                catch (e) {
                    this.emit('error', new verror_1.SError(e, 'error sending reject. packet=%s', reply));
                }
            });
        }).catch(e => {
            this.emit('error', new verror_1.SError(e, 'error reading request. request=%', request));
        });
    }
}
exports.IlpHttpEndpoint = IlpHttpEndpoint;
async function writeIlpHttpRequest(client, request, sentCallback) {
    if (sentCallback)
        sentCallback();
    return {
        fulfillment: Buffer.alloc(0),
        data: Buffer.alloc(0)
    };
}
exports.writeIlpHttpRequest = writeIlpHttpRequest;
async function readIlpHttpRequest(request) {
    return {
        amount: '',
        destination: '',
        executionCondition: Buffer.alloc(0),
        expiresAt: new Date(),
        data: Buffer.alloc(0)
    };
}
exports.readIlpHttpRequest = readIlpHttpRequest;
function writeIlpHttpResponse(response, reply, sentCallback) {
    if (sentCallback)
        sentCallback();
    response.setHeader('content-type', '');
    response.write(reply.data, sentCallback);
}
exports.writeIlpHttpResponse = writeIlpHttpResponse;
//# sourceMappingURL=http-endpoint.js.map