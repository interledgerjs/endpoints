"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
class Requestor {
    constructor(stream) {
        this._map = new Map();
        this._nextCorrelationId = 1;
        this._stream = stream;
        this._stream.on('data', (chunk) => {
            const callback = this._map.get(chunk.id);
            if (callback) {
                callback(chunk.message);
            }
            else {
                throw new Error(`unsolicited messaged received with id: ${chunk.id}`);
            }
        });
    }
    request(message, timeout) {
        const id = this._nextCorrelationId++;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this._map.delete(id);
                reject(new Error('timed out'));
            }, timeout);
            this._map.set(id, (reply) => {
                this._map.delete(id);
                clearTimeout(timer);
                resolve(reply);
            });
            this._stream.write({ id, message });
        });
    }
}
class MirrorStream extends stream_1.Duplex {
    constructor() {
        super({ objectMode: true });
    }
    _write(chunk, encoding, callback) {
        try {
            callback();
            this.push(chunk);
        }
        catch (e) {
            callback(e);
        }
    }
    _read(size) {
    }
}
const requestor1 = new Requestor(new stream_1.PassThrough({ objectMode: true }));
requestor1.request('test', 10000).then((reply) => {
    console.log(`Got reply: ${reply}`);
});
const requestor2 = new Requestor(new MirrorStream());
requestor2.request('test', 10000).then((reply) => {
    console.log(`Got reply: ${reply}`);
});
//# sourceMappingURL=asynch_test.js.map