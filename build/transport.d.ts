/// <reference types="node" />
import { EventEmitter } from 'events';
import { IlpPrepare, IlpReply } from 'ilp-packet';
import { IlpEndpoint, RequestHandlerProvider } from './endpoint';
import { Duplex } from 'stream';
export declare const DEFAULT_BATCH = 1;
export declare const DEFAULT_BATCH_CUTOVER_TIMEOUT_MS: number;
export declare const DEFAULT_MAX_TIMEOUT_MS: number;
interface IlpTransportOptions {
    handlerProvider?: RequestHandlerProvider;
    batch?: number;
    batchCutoverTimeoutMs?: number;
    maxTimeoutMs?: number;
}
export declare class IlpTransport extends EventEmitter implements IlpEndpoint {
    protected _stream: Duplex;
    protected _requestIdsByBatch: Map<number, number>;
    protected _outgoing: Map<number, {
        respond: (response: Buffer) => void;
        timeout: NodeJS.Timeout;
    }>;
    protected _incoming: Set<number>;
    protected _batch: number;
    protected _newBatch: number;
    protected _minimumBatch: number;
    protected _batchCutoverTimeoutMs: number;
    protected _maxTimeoutMs: number;
    constructor(stream: Duplex, options?: IlpTransportOptions);
    handlerProvider: RequestHandlerProvider;
    address?: string;
    readonly batch: number;
    newBatch(batch: number): void;
    request(request: IlpPrepare, sentCallback?: (error?: Error) => void): Promise<IlpReply>;
    private _nextMessage;
    private _handleMessage;
}
export {};
