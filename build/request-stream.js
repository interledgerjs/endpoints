"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function pipeline(...bidirectionalDuplexes) {
    for (let i = 0; i + 1 < bidirectionalDuplexes.length; i++) {
        const incomingReadable = bidirectionalDuplexes[i].incoming;
        const incomingWritable = bidirectionalDuplexes[i + 1].incoming;
        const outgoingReadable = bidirectionalDuplexes[i + 1].outgoing;
        const outgoingWritable = bidirectionalDuplexes[i].outgoing;
        incomingReadable.pipe(incomingWritable);
        outgoingReadable.pipe(outgoingWritable);
    }
    return {
        incoming: {
            write: (request) => {
                return bidirectionalDuplexes[0].incoming.write(request);
            },
            pipe: (writable) => {
                return bidirectionalDuplexes[bidirectionalDuplexes.length - 1].incoming.pipe(writable);
            },
            unpipe: () => {
                return bidirectionalDuplexes[bidirectionalDuplexes.length - 1].incoming.unpipe();
            }
        },
        outgoing: {
            write: (request) => {
                return bidirectionalDuplexes[bidirectionalDuplexes.length - 1].outgoing.write(request);
            },
            pipe: (writable) => {
                return bidirectionalDuplexes[0].outgoing.pipe(writable);
            },
            unpipe: () => {
                return bidirectionalDuplexes[0].outgoing.unpipe();
            }
        }
    };
}
exports.pipeline = pipeline;
//# sourceMappingURL=request-stream.js.map