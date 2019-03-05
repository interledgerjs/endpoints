"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ilp_packet_1 = require("ilp-packet");
function isRequest(packet) {
    return (packet.id & 1) === 0;
}
exports.isRequest = isRequest;
function isReply(packet) {
    return (packet.id & 1) === 1;
}
exports.isReply = isReply;
function serializeFrame(frame) {
    const payload = ilp_packet_1.isPrepare(frame) ? ilp_packet_1.serializeIlpPrepare(frame) :
        ilp_packet_1.isFulfill(frame) ? ilp_packet_1.serializeIlpFulfill(frame) :
            ilp_packet_1.serializeIlpReject(frame);
    const buffer = Buffer.allocUnsafe(8 + payload.length);
    buffer.writeInt32BE(frame.id, 0);
    buffer.writeInt32BE(frame.batch, 4);
    payload.copy(buffer, 8);
    return buffer;
}
exports.serializeFrame = serializeFrame;
function deserializeFrame(data) {
    const packet = ilp_packet_1.deserializeIlpPacket(data.slice(8));
    return Object.assign({
        id: data.readUInt32BE(0),
        batch: data.readUInt32BE(4),
    }, packet.data);
}
exports.deserializeFrame = deserializeFrame;
//# sourceMappingURL=packet.js.map