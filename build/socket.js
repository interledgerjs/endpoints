"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const packet_1 = require("./packet");
const verror_1 = require("verror");
const request_1 = require("./request");
const events_1 = require("events");
const ilp_logger_1 = require("ilp-logger");
const ilp_packet_1 = require("ilp-packet");
const net_1 = require("net");
const errors_1 = require("ilp-packet/dist/src/errors");
const log = ilp_logger_1.default('grpc-transport');
exports.ILP_TCP_URL_PROTOCOL = 'ilp+tcp:';
exports.ILP_IPC_URL_PROTOCOL = 'ilp+ipc:';
class IlpSocket extends events_1.EventEmitter {
    constructor(socket) {
        super();
        this._socket = socket;
        this._requests = new Map();
        this._socket.on('data', (data) => {
            this._handleData(data);
        });
        this._socket.on('close', () => {
            this.emit('close');
        });
        this._socket.on('error', (error) => {
            this.emit('error', error);
        });
    }
    address() {
        const { address, port, family } = this._socket.address();
        return {
            address,
            port,
            family: 'ILPv4+' + family,
            ilpAddress: this.session ? this.session.localIlpAddress : 'self'
        };
    }
    request(message, sentCallback) {
        return new Promise((replyCallback, errorCallback) => {
            const frameHeader = this._nextFrameHeaders();
            const key = _requestKey(frameHeader);
            const frame = Object.assign(frameHeader, message);
            this._requests.set(key, new request_1.Request(frame, (response) => {
                this._requests.delete(key);
                replyCallback(response);
            }, () => {
                this._requests.delete(key);
                errorCallback(new verror_1.SError('timed out waiting for response'));
            }));
            this._socket.write(packet_1.serializeFrame(frame), sentCallback);
        });
    }
    _nextFrameHeaders() {
        const batch = (this.session) ? this.session.currentBatch : 1;
        const oldId = this._requestIdsByBatch.get(batch);
        const id = (typeof oldId !== 'number') ? 0 : oldId + 2;
        this._requestIdsByBatch.set(batch, id);
        return { id, batch };
    }
    _handleData(data) {
        try {
            const frame = packet_1.deserializeFrame(data);
            if (packet_1.isRequest(frame)) {
                this._handleRequest(frame);
            }
            else {
                this._handleReply(frame);
            }
        }
        catch (e) {
            log.trace('Handle Data Error', data);
            this.emit('error', new verror_1.SError(e, `Unable to deserialize frame: ${data.toString('hex')}`));
        }
    }
    _handleRequest(frame) {
        if (this._requestHandler) {
            this._requestHandler(frame.batch, frame)
                .then(reply => {
                this._socket.write(packet_1.serializeFrame(Object.assign({
                    id: frame.id | 1,
                    batch: frame.batch,
                }, reply)));
            })
                .catch(e => {
                this.emit('error', e);
                this._socket.write(packet_1.serializeFrame({
                    id: frame.id | 1,
                    batch: frame.batch,
                    triggeredBy: this.address().ilpAddress,
                    code: errors_1.codes.T00_INTERNAL_ERROR,
                    message: '',
                    data: Buffer.allocUnsafe(0)
                }));
            });
        }
        else {
            this.emit('error', new verror_1.SError('no request handler registered for incoming request: %s', frame));
            this._socket.write(packet_1.serializeFrame({
                id: frame.id | 1,
                batch: frame.batch,
                triggeredBy: this.address().ilpAddress,
                code: errors_1.codes.T01_PEER_UNREACHABLE,
                message: '',
                data: Buffer.allocUnsafe(0)
            }));
        }
    }
    _handleReply(frame) {
        const originalRequest = this._requests.get(_requestKey(frame));
        if (!originalRequest) {
            this.emit('error', new verror_1.SError('unsolicited response message received: %s', frame));
        }
        else {
            originalRequest.responseReceived(frame);
        }
    }
}
exports.IlpSocket = IlpSocket;
function _requestKey(headers) {
    const { id, batch } = headers;
    const buffer = Buffer.allocUnsafe(8);
    buffer.writeInt32BE(id & 0, 0);
    buffer.writeInt32BE(batch, 4);
    return buffer.toString('hex');
}
async function authenticateWithPeer(socket, accountId, secret) {
    const rsp = await this.request(0, {
        destination: 'peer.auth',
        amount: '0',
        executionCondition: Buffer.allocUnsafe(32),
        expiresAt: new Date(Date.now() + 30 * 1000),
        data: Buffer.from(accountId, 'utf8')
    });
    if (ilp_packet_1.isReject(rsp)) {
        throw new Error('Auth rejected');
    }
    const result = JSON.parse(rsp.data.toString('utf8'));
}
exports.authenticateWithPeer = authenticateWithPeer;
async function createConnection(url, createSession) {
    const accountId = url.username;
    const accountSecret = url.password;
    return new Promise((resolve, reject) => {
        async function handleConnect(socket) {
            const ilpSocket = new IlpSocket(socket);
            if (accountId || accountSecret) {
                await authenticateWithPeer(ilpSocket, accountId, accountSecret);
            }
            if (createSession) {
                await createSession(ilpSocket);
            }
            return ilpSocket;
        }
        if (url.protocol === exports.ILP_TCP_URL_PROTOCOL) {
            const tcpSocket = net_1.createConnection(Number(url.port), url.hostname, () => {
                handleConnect(tcpSocket);
            });
        }
        else if (url.protocol === exports.ILP_IPC_URL_PROTOCOL) {
            const ipcSocket = net_1.createConnection(url.pathname, () => {
                handleConnect(ipcSocket);
            });
        }
        else {
            throw new Error(`Unknown protocol: ${url.protocol}`);
        }
    });
}
exports.createConnection = createConnection;
//# sourceMappingURL=socket.js.map