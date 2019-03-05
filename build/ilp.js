"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ilp_packet_1 = require("ilp-packet");
const stream_endpoint_1 = require("./stream-endpoint");
const frame_1 = require("./frame");
function isMessage(object) {
    return frame_1.isMessageFrame(object, isRequest, isReply);
}
function isRequest(request) {
    return ilp_packet_1.isPrepare(request);
}
function isReply(reply) {
    return ilp_packet_1.isFulfill(reply) || ilp_packet_1.isReject(reply);
}
function decode(payload) {
    return ilp_packet_1.deserializeIlpPacket(payload).data;
}
function encode(payload) {
    if (ilp_packet_1.isPrepare(payload)) {
        return ilp_packet_1.serializeIlpPrepare(payload);
    }
    if (ilp_packet_1.isFulfill(payload)) {
        return ilp_packet_1.serializeIlpFulfill(payload);
    }
    return ilp_packet_1.serializeIlpReject(payload);
}
class IlpStreamEndpoint extends stream_endpoint_1.StreamEndpoint {
    constructor(options) {
        super({ isMessage, isRequest, decode, encode }, options);
    }
}
exports.IlpStreamEndpoint = IlpStreamEndpoint;
class AddressMappedHandlerProvider {
    constructor(handlers) {
        if (handlers) {
            for (const [address, handler] of handlers) {
                this.handlers.set(address, handler);
            }
        }
    }
    get defaultHandler() {
        return this.handlers.get('*');
    }
    set defaultHandler(handler) {
        if (handler) {
            this.handlers.set('*', handler);
        }
        else {
            this.handlers.delete('*');
        }
    }
    async handleRequest(request) {
        if (request.destination.startsWith('peer')) {
            const handler = this.handlers.get(request.destination);
            if (handler)
                return handler(request);
        }
        const handler = this.handlers.get('*');
        if (handler)
            return handler(request);
        throw new Error('no handler for request. ' + JSON.stringify(request));
    }
}
exports.AddressMappedHandlerProvider = AddressMappedHandlerProvider;
//# sourceMappingURL=ilp.js.map