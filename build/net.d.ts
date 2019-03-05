/// <reference types="node" />
import { Duplex } from 'stream';
import { IlpMessage } from './message';
export declare class IlpMessageStream extends Duplex {
    protected _stream: Duplex;
    protected _buffering: boolean;
    protected _buffer: Array<IlpMessage>;
    protected _readBuffer: Buffer;
    protected _readCursor: number;
    constructor(stream: Duplex);
    private _end;
    private _readChunk;
    _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void;
    _read(size: number): void;
    _destroy(error: Error | null, callback: (error: Error | null) => void): void;
    _final(callback: (error?: Error | null) => void): void;
}
