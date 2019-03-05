"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ilp_packet_1 = require("ilp-packet");
function isIlpMessage(object) {
    return (typeof object.id === 'number') && (typeof object.batch === 'number') && (Buffer.isBuffer(object.payload));
}
exports.isIlpMessage = isIlpMessage;
function isRequestMessage(message) {
    const [buffer, offset] = Buffer.isBuffer(message) ? [message, 9] : [message.payload, 0];
    return buffer.length >= offset && buffer[offset] === ilp_packet_1.Type.TYPE_ILP_PREPARE;
}
exports.isRequestMessage = isRequestMessage;
function isReplyMessage(message) {
    const [buffer, offset] = Buffer.isBuffer(message) ? [message, 9] : [message.payload, 0];
    return buffer.length >= offset && (buffer[offset] === ilp_packet_1.Type.TYPE_ILP_FULFILL || buffer[offset] === ilp_packet_1.Type.TYPE_ILP_REJECT);
}
exports.isReplyMessage = isReplyMessage;
function serializeIlpMessage(message) {
    const buffer = Buffer.allocUnsafe(8 + message.payload.length);
    buffer.writeInt32BE(message.batch, 0);
    buffer.writeInt32BE(message.id, 4);
    message.payload.copy(buffer, 8);
    return buffer;
}
exports.serializeIlpMessage = serializeIlpMessage;
function deserializeIlpMessage(data) {
    return {
        batch: data.readUInt32BE(0),
        id: data.readUInt32BE(4),
        payload: data.slice(8)
    };
}
exports.deserializeIlpMessage = deserializeIlpMessage;
//# sourceMappingURL=message.js.map