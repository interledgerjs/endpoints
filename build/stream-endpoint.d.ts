/// <reference types="node" />
import { MessageFrameTypeGuard } from './frame';
import { Endpoint } from './endpoint';
import { Duplex } from 'stream';
import { RequestHandler } from './request-stream';
export declare type ExpiringRequest = {
    expiresAt: Date;
};
export declare const DEFAULT_MAX_TIMEOUT_MS: number;
export interface MessageStreamCodecs<Request, Reply> {
    isMessage: MessageFrameTypeGuard<Request, Reply>;
    encode: (payload: Request | Reply) => Buffer;
    decode: (payload: Buffer) => Request | Reply;
    isRequest(payload: any): payload is Request;
}
export interface StreamEndpointOptions<Request, Reply> {
    handler?: RequestHandler<Request, Reply>;
    nextRequestId?: number;
    maxTimeoutMs?: number;
}
export declare class StreamEndpoint<Request extends ExpiringRequest, Reply> extends Duplex implements Endpoint<Request, Reply> {
    protected _outgoingMessageStream: Duplex;
    protected _incomingMessageStream: Duplex;
    protected _isRequest: (payload: any) => payload is Request;
    protected _isMessageFrame: MessageFrameTypeGuard<Request, Reply>;
    protected _nextRequestId: number;
    protected _outgoing: Map<number, {
        respond: (response: Reply) => void;
        timeout: NodeJS.Timeout;
    }>;
    protected _incoming: Set<number>;
    protected _maxTimeoutMs: number;
    protected _incomingRequestHandler: RequestHandler<Request, Reply>;
    constructor(codecs: MessageStreamCodecs<Request, Reply>, options?: StreamEndpointOptions<Request, Reply>);
    sendOutgoingRequest(request: Request, sentCallback?: () => void): Promise<Reply>;
    setIncomingRequestHandler(handler: RequestHandler<Request, Reply>): this;
    private _nextMessage;
    private _handleMessage;
}
