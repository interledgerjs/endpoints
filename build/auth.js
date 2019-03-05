"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ilp_packet_1 = require("ilp-packet");
const verror_1 = require("verror");
const transport_1 = require("./transport");
const net_1 = require("net");
exports.ILP_TLS_URL_PROTOCOL = 'ilp+tls:';
exports.ILP_TCP_URL_PROTOCOL = 'ilp+tcp:';
exports.ILP_IPC_URL_PROTOCOL = 'ilp+ipc:';
function createBasicAuth(username, password, expiryMs) {
    return {
        authProtocol: 'basic',
        authCondition: Buffer.alloc(32),
        authData: Buffer.from(`${username}:${password}`, 'utf8'),
        authTimeout: new Date(Date.now() + expiryMs)
    };
}
exports.createBasicAuth = createBasicAuth;
function deserializeAuth(data) {
    return {
        accountId: 'test',
        accountInfo: {
            assetCode: 'USD',
            assetScale: 2,
            relation: 'peer'
        },
        address: 'test.123.test'
    };
}
exports.deserializeAuth = deserializeAuth;
async function authenticate(endpoint, options) {
    const rsp = await endpoint.request({
        destination: 'peer.auth.' + options.authProtocol,
        amount: '0',
        executionCondition: options.authCondition,
        expiresAt: options.authTimeout || new Date(Date.now() + 30 * 1000),
        data: options.authData
    });
    if (ilp_packet_1.isReject(rsp)) {
        throw new verror_1.SError('auth rejected: %s', rsp);
    }
    const { accountInfo, address } = deserializeAuth(rsp.data);
    const { assetCode, assetScale } = accountInfo;
    return {
        address,
        assetCode,
        assetScale
    };
}
exports.authenticate = authenticate;
async function createSession(url, requestHandler) {
    const accountId = url.username;
    const accountPassword = url.password;
    return new Promise((resolve, reject) => {
        async function handleConnect(socket) {
            const ilpStream = new transport_1.IlpTransport(socket);
            ilpStream.handlers.set('*', requestHandler);
            await authenticate(ilpStream, createBasicAuth(accountId, accountPassword, 30 * 1000));
            return ilpStream;
        }
        if (url.protocol === exports.ILP_TCP_URL_PROTOCOL) {
            const tcpSocket = net_1.createConnection(Number(url.port), url.hostname, () => {
                return handleConnect(tcpSocket);
            });
        }
        else if (url.protocol === exports.ILP_IPC_URL_PROTOCOL) {
            const ipcSocket = net_1.createConnection(url.pathname, () => {
                return handleConnect(ipcSocket);
            });
        }
        else if (url.protocol === exports.ILP_TLS_URL_PROTOCOL) {
            throw new Error(`TLS has not been implemented yet.`);
        }
        else {
            throw new Error(`Unknown protocol: ${url.protocol}`);
        }
    });
}
exports.createSession = createSession;
//# sourceMappingURL=auth.js.map