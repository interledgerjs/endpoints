"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const http = require("http2");
const ilp_packet_1 = require("ilp-packet");
exports.DEFAULT_MAX_TIMEOUT_MS = 5 * 60 * 1000;
class HttpIlpEndpoint extends events_1.EventEmitter {
    constructor(options) {
        super();
        this._maxTimeoutMs = (options && options.maxTimeoutMs)
            ? options.maxTimeoutMs
            : exports.DEFAULT_MAX_TIMEOUT_MS;
        const createServer = options.serverOptions.secure ? http.createSecureServer : http.createServer;
        this._server = createServer(options.serverOptions, async (request, response) => {
            return this._handleRequest(request, response);
        });
        this._server.on('sessionError', (error) => {
            this.emit('error', error);
        });
        this._client = http.connect(options.peerUrl, options.clientOptions);
        if (options && options.handler) {
            this._handler = options.handler;
        }
        else {
            this._handler = (packet) => {
                throw new Error('no handler provided for incoming requests');
            };
        }
    }
    sendOutgoingRequest(request, sentCallback) {
        if (!this._client)
            throw new Error('underlying stream is not writeable');
        const timeoutMs = request.expiresAt.valueOf() - Date.now();
        if (timeoutMs > this._maxTimeoutMs || timeoutMs <= 0) {
            throw new Error(`invalid expiresAt in ILP packet. timeoutMs=${timeoutMs}, maxTimeoutMs=${this._maxTimeoutMs}`);
        }
        return (async () => {
            const timeout = setTimeout(() => {
                throw new Error('timed out waiting for response');
            }, timeoutMs);
            try {
                return await writeIlpHttpRequest(this._client, request, sentCallback);
            }
            finally {
                clearTimeout(timeout);
            }
        })();
    }
    setIncomingRequestHandler(handler) {
        this._handler = handler;
        return this;
    }
    async _handleRequest(request, response) {
        const prepare = await readIlpHttpRequest(request);
        const timeout = setTimeout(() => {
            throw new Error('timed out waiting for response from request handler. packet=' + JSON.stringify(prepare));
        }, prepare.expiresAt.valueOf() - Date.now());
        try {
            writeIlpHttpResponse(response, await this._handler(prepare));
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
exports.HttpIlpEndpoint = HttpIlpEndpoint;
async function writeIlpHttpRequest(client, request, sentCallback) {
    return new Promise((resolve, reject) => {
        const stream = client.request({
            'content-type': '',
            'ilp-destination': request.destination,
            'ilp-expires-at': request.expiresAt.toISOString(),
            'ilp-condition': request.executionCondition.toString('base64')
        });
        stream.on('error', (error) => {
            reject(error);
        });
        stream.on('response', (headers, flags) => {
            stream.on('data', (data) => {
                stream.end();
                if (headers['content-type'] === 'application/ilp-fulfill') {
                    resolve({
                        fulfillment: Buffer.from(headers['ilp-fulfillment'], 'base64'),
                        data
                    });
                }
                else {
                    resolve({
                        code: headers['ilp-reject-code'],
                        message: headers['ilp-reject-message'],
                        triggeredBy: headers['ilp-reject-triggered-by'],
                        data
                    });
                }
            });
        });
        stream.write(request.data, sentCallback);
    });
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
    if (ilp_packet_1.isFulfill(reply)) {
        response.setHeader('content-type', '');
        response.setHeader('ilp-fulfillment', reply.fulfillment.toString('base64'));
    }
    else {
        response.setHeader('content-type', '');
        response.setHeader('ilp-reject-code', reply.code);
        response.setHeader('ilp-reject-message', reply.message);
        response.setHeader('ilp-reject-triggered-by', reply.triggeredBy);
    }
    response.write(reply.data, sentCallback);
}
exports.writeIlpHttpResponse = writeIlpHttpResponse;
//# sourceMappingURL=http-ilp-endpoint.js.map