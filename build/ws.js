"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const message_1 = require("./message");
class WebSocketMessageStream extends stream_1.Duplex {
    constructor(socket, deserializer, serializer, isMessage) {
        super({
            allowHalfOpen: false,
            objectMode: true
        });
        this._buffering = false;
        this._buffer = new Array();
        this._deserializer = deserializer;
        this._serializer = serializer;
        this._isMessage = isMessage;
        this._socket = socket;
        this._socket.on('close', (code, reason) => {
            this._end();
        });
        this._socket.on('error', (err) => {
            this.emit('error', err);
        });
        this._socket.on('message', (data) => {
            if (Buffer.isBuffer(data)) {
                try {
                    const message = deserializer(data);
                    if (this._buffering) {
                        this._buffer.push(message);
                    }
                    else {
                        this._buffering = !this.push(message);
                    }
                }
                catch (e) {
                    this._socket.close(1008, 'unable to deserialize message');
                    this.emit('error', e);
                    this._end();
                }
            }
            else {
                this._socket.close(1003, 'unexpected message type');
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
    _write(chunk, encoding, callback) {
        if (this._isMessage(chunk)) {
            const bytes = this._serializer(chunk);
            this._socket.send(bytes, callback);
        }
        else {
            callback(new Error('unexpected message type. expected a '));
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
        this._socket.terminate();
        callback(error);
    }
    _final(callback) {
        try {
            this._socket.close(1000, 'connection closed');
            callback();
        }
        catch (e) {
            callback(e);
        }
    }
}
exports.WebSocketMessageStream = WebSocketMessageStream;
class WebSocketIlpMessageStream extends WebSocketMessageStream {
    constructor(socket) {
        super(socket, message_1.deserializeIlpMessage, message_1.serializeIlpMessage, message_1.isIlpMessage);
    }
}
exports.WebSocketIlpMessageStream = WebSocketIlpMessageStream;
//# sourceMappingURL=ws.js.map