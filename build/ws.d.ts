/// <reference types="node" />
import * as WebSocket from 'ws';
import { Duplex } from 'stream';
import { IlpMessage } from './message';
export declare class WebSocketMessageStream<M> extends Duplex {
    protected _socket: WebSocket;
    protected _buffering: boolean;
    protected _buffer: Array<M>;
    protected _deserializer: (data: Buffer) => M;
    protected _serializer: (message: M) => Buffer;
    protected _isMessage: (message: any) => message is M;
    constructor(socket: WebSocket, deserializer: (data: Buffer) => M, serializer: (message: M) => Buffer, isMessage: (message: any) => message is M);
    private _end;
    _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void;
    _read(size: number): void;
    _destroy(error: Error | null, callback: (error: Error | null) => void): void;
    _final(callback: (error?: Error | null) => void): void;
}
export declare class WebSocketIlpMessageStream extends WebSocketMessageStream<IlpMessage> {
    constructor(socket: WebSocket);
}
