"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_ID_LENGTH = 4;
function isMessageFrame(object, isRequest, isReply) {
    return (typeof object.id === 'number')
        && (typeof object.payload !== 'undefined')
        && (isRequest(object) || isReply(object));
}
exports.isMessageFrame = isMessageFrame;
function serializeMessageFrame(frame, encode) {
    const payload = encode(frame.payload);
    const buffer = Buffer.allocUnsafe(exports.MESSAGE_ID_LENGTH + payload.length);
    buffer.writeUInt32BE(frame.id, 0);
    payload.copy(buffer, exports.MESSAGE_ID_LENGTH);
    return buffer;
}
exports.serializeMessageFrame = serializeMessageFrame;
function deserializeMessageFrame(data, decode) {
    return {
        id: data.readUInt32BE(0),
        payload: decode(data.slice(exports.MESSAGE_ID_LENGTH))
    };
}
exports.deserializeMessageFrame = deserializeMessageFrame;
//# sourceMappingURL=frame.js.map