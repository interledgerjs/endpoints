/// <reference types="node" />
import { Transform } from 'stream';
import { MessageFrameTypeGuard, Encoder, Decoder } from './frame';
export declare class MessageDecoder<Request, Reply> extends Transform {
    constructor(decode: Decoder<Request, Reply>, isMessage: MessageFrameTypeGuard<Request, Reply>);
}
export declare class MessageEncoder<Request, Reply> extends Transform {
    constructor(encode: Encoder<Request, Reply>, isMessage: MessageFrameTypeGuard<Request, Reply>);
}
export declare function getReadBuffer(buffer: Buffer, cursor: number, chunk: Buffer): Buffer;
export declare function getMessageSize(buffer: Buffer, cursor: number): number | undefined;
