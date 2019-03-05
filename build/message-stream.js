"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const frame_1 = require("./frame");
class MessageDecoder extends stream_1.Transform {
    constructor(decode, isMessage) {
        let _readBuffer = Buffer.allocUnsafe(0);
        let _readCursor = 0;
        super({
            allowHalfOpen: false,
            readableObjectMode: true,
            transform(chunk, encoding, callback) {
                if (Buffer.isBuffer(chunk)) {
                    _readBuffer = getReadBuffer(_readBuffer, _readCursor, chunk);
                    _readCursor = 0;
                    let messageSize = getMessageSize(_readBuffer, _readCursor);
                    while (messageSize !== undefined && _readBuffer.length >= messageSize) {
                        const message = {
                            id: _readBuffer.readUInt32BE(_readCursor),
                            payload: decode(_readBuffer.slice(_readCursor + frame_1.MESSAGE_ID_LENGTH, _readCursor + messageSize))
                        };
                        if (isMessage(message)) {
                            this.push(message);
                        }
                        else {
                            this.emit('error', new Error('invalid object decoded from underlying stream. ' + JSON.stringify(message)));
                        }
                        _readCursor += messageSize;
                        messageSize = getMessageSize(_readBuffer, _readCursor);
                    }
                    callback();
                }
                else {
                    this.destroy(new Error('unexpected type read from underlying stream'));
                }
            }
        });
    }
}
exports.MessageDecoder = MessageDecoder;
class MessageEncoder extends stream_1.Transform {
    constructor(encode, isMessage) {
        super({
            allowHalfOpen: false,
            writableObjectMode: true,
            transform(chunk, encoding, callback) {
                if (isMessage(chunk)) {
                    this.push(frame_1.serializeMessageFrame(chunk, encode));
                }
                else {
                    callback(new Error('unexpected message type.'));
                }
            }
        });
    }
}
exports.MessageEncoder = MessageEncoder;
function getReadBuffer(buffer, cursor, chunk) {
    const unreadBytes = getUnreadByteCount(buffer, cursor);
    if (unreadBytes > 0) {
        const newBuffer = Buffer.allocUnsafe(unreadBytes + chunk.length);
        buffer.copy(newBuffer, 0, cursor);
        chunk.copy(newBuffer, unreadBytes, 0);
        return newBuffer;
    }
    else {
        return chunk;
    }
}
exports.getReadBuffer = getReadBuffer;
function getUnreadByteCount(buffer, cursor) {
    return buffer.length - cursor;
}
function getMessageSize(buffer, cursor) {
    const LENGTH_OFFSET = 5;
    const unreadByteCount = getUnreadByteCount(buffer, cursor);
    if (unreadByteCount > LENGTH_OFFSET) {
        const length = buffer[cursor + LENGTH_OFFSET];
        if ((length & 0x80) === 0x80) {
            const lengthOfLength = length & 0x7f;
            if (lengthOfLength === 0) {
                return undefined;
            }
            if (unreadByteCount > (LENGTH_OFFSET + 1 + lengthOfLength)) {
                const actualLength = buffer.readUIntBE(cursor + LENGTH_OFFSET + 1, lengthOfLength);
                if (actualLength < 0x80) {
                    return undefined;
                }
                if (unreadByteCount >= LENGTH_OFFSET + 1 + lengthOfLength + actualLength) {
                    return LENGTH_OFFSET + 1 + lengthOfLength + actualLength;
                }
            }
            return undefined;
        }
        if (unreadByteCount >= LENGTH_OFFSET + 1 + length) {
            return LENGTH_OFFSET + 1 + length;
        }
    }
    return undefined;
}
exports.getMessageSize = getMessageSize;
//# sourceMappingURL=message-stream.js.map