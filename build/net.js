"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const message_1 = require("./message");
class IlpMessageStream extends stream_1.Duplex {
    constructor(stream) {
        super({
            allowHalfOpen: false,
            objectMode: true
        });
        this._readBuffer = Buffer.allocUnsafe(0);
        this._readCursor = 0;
        this._stream = stream;
        this._buffering = false;
        this._buffer = new Array();
        this._stream.on('close', (code, reason) => {
            this._end();
        });
        this._stream.on('error', (err) => {
            this.emit('error', err);
        });
        this._stream.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                this._readChunk(chunk);
            }
            else {
                this._stream.end();
                this.emit('error', new Error('unexpected message type received'));
                this._end();
            }
        });
    }
    _end() {
        while (this._buffer.length > 0) {
            this.push(this._buffer.shift());
        }
        this.push(null);
    }
    _readChunk(chunk) {
        this._readBuffer = getReadBuffer(this._readBuffer, this._readCursor, chunk);
        this._readCursor = 0;
        let messageSize = getMessageSize(this._readBuffer, this._readCursor);
        while (messageSize !== undefined && this._readBuffer.length >= messageSize) {
            const message = {
                batch: this._readBuffer.readUInt32BE(0),
                id: this._readBuffer.readUInt32BE(4),
                payload: this._readBuffer.slice(8, messageSize - 8)
            };
            if (this._buffering) {
                this._buffer.push(message);
            }
            else {
                this._buffering = !(this.push(message));
            }
            this._readCursor += messageSize;
            messageSize = getMessageSize(this._readBuffer, this._readCursor);
        }
    }
    _write(chunk, encoding, callback) {
        if (message_1.isIlpMessage(chunk)) {
            this._stream.write(message_1.serializeIlpMessage(chunk), callback);
        }
        else {
            callback(new Error('unexpected message type.'));
        }
    }
    _read(size) {
        if (this._buffering) {
            this._buffering = false;
            while (this._buffer.length > 0 && !this._buffering) {
                this._buffering = !(this.push(this._buffer.shift()));
            }
        }
    }
    _destroy(error, callback) {
        this._stream.destroy((error !== null) ? error : undefined);
        callback(error);
    }
    _final(callback) {
        try {
            this._stream.end(callback);
        }
        catch (e) {
            callback(e);
        }
    }
}
exports.IlpMessageStream = IlpMessageStream;
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
function getUnreadByteCount(buffer, cursor) {
    return buffer.length - cursor;
}
function getMessageSize(buffer, cursor) {
    const LENGTH_OFFSET = 9;
    const unreadByteCount = getUnreadByteCount(buffer, cursor);
    if (unreadByteCount > LENGTH_OFFSET) {
        const length = buffer[cursor + LENGTH_OFFSET];
        if ((length & 0x80) === 0x80) {
            if (unreadByteCount > (LENGTH_OFFSET + 1 + length)) {
                const actualLength = buffer.readIntBE(cursor + LENGTH_OFFSET + 1, length);
                if (unreadByteCount >= LENGTH_OFFSET + 1 + length + actualLength) {
                    return LENGTH_OFFSET + 1 + length + actualLength;
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
//# sourceMappingURL=net.js.map