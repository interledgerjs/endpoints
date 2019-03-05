"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ilp_1 = require("./ilp");
function createIlpWebSocketEndpoint(ws, options) {
    const endpoint = new ilp_1.IlpStreamEndpoint(options);
    ws.on('message', (data) => {
        if (Buffer.isBuffer(data)) {
            try {
                endpoint.write(data);
            }
            catch (e) {
                ws.close(1008, 'unable to handle message');
            }
        }
        else {
            ws.close(1003, 'unexpected message type');
        }
    });
    endpoint.on('data', (chunk) => {
        ws.send(chunk);
    });
    return {
        sendOutgoingRequest: (request, sentCallback) => {
            return endpoint.sendOutgoingRequest(request, sentCallback);
        },
        setIncomingRequestHandler: (handler) => {
            endpoint.setIncomingRequestHandler(handler);
            return this;
        }
    };
}
exports.createIlpWebSocketEndpoint = createIlpWebSocketEndpoint;
//# sourceMappingURL=ilp-ws.js.map