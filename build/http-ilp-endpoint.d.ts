/// <reference types="node" />
import { EventEmitter } from 'events';
import * as http from 'http2';
import * as url from 'url';
import { IlpPrepare, IlpReply } from 'ilp-packet';
import { Endpoint } from './endpoint';
import { IlpRequestHander as IlpRequestHandler } from './ilp';
export declare const DEFAULT_MAX_TIMEOUT_MS: number;
interface HttpIlpEndpointOptions {
    peerUrl: string | url.URL;
    clientOptions?: http.ClientSessionOptions | http.SecureClientSessionOptions;
    serverOptions: http.SecureServerOptions & {
        secure: boolean;
    };
    handler?: IlpRequestHandler;
    maxTimeoutMs?: number;
}
export declare class HttpIlpEndpoint extends EventEmitter implements Endpoint<IlpPrepare, IlpReply> {
    protected _server: http.Http2Server;
    protected _client: http.ClientHttp2Session;
    protected _maxTimeoutMs: number;
    protected _handler: IlpRequestHandler;
    constructor(options: HttpIlpEndpointOptions);
    address?: string;
    sendOutgoingRequest(request: IlpPrepare, sentCallback?: (() => void) | undefined): Promise<IlpReply>;
    setIncomingRequestHandler(handler: IlpRequestHandler): this;
    private _handleRequest;
}
export declare function writeIlpHttpRequest(client: http.ClientHttp2Session, request: IlpPrepare, sentCallback?: (error?: Error) => void): Promise<IlpReply>;
export declare function readIlpHttpRequest(request: http.Http2ServerRequest): Promise<IlpPrepare>;
export declare function writeIlpHttpResponse(response: http.Http2ServerResponse, reply: IlpReply, sentCallback?: (error?: Error) => void): void;
export {};
