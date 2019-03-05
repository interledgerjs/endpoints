/// <reference types="node" />
import { EventEmitter } from 'events';
import * as http from 'http2';
import * as url from 'url';
import { IlpPrepare, IlpReply } from 'ilp-packet';
import { IlpEndpoint, RequestHandlerProvider } from './endpoint';
export declare const DEFAULT_MAX_TIMEOUT_MS: number;
interface IlpTransportOptions {
    handlerProvider?: RequestHandlerProvider;
    batch?: number;
    batchCutoverTimeoutMs?: number;
    maxTimeoutMs?: number;
}
interface IlpHttpEndpointOptions extends IlpTransportOptions {
    peerUrl: string | url.URL;
    clientOptions?: http.ClientSessionOptions | http.SecureClientSessionOptions;
    serverOptions: http.SecureServerOptions & {
        secure: boolean;
    };
}
export declare class IlpHttpEndpoint extends EventEmitter implements IlpEndpoint {
    protected _server: http.Http2Server;
    protected _client: http.ClientHttp2Session;
    protected _maxTimeoutMs: number;
    constructor(options: IlpHttpEndpointOptions);
    handlerProvider: RequestHandlerProvider;
    address?: string;
    request(request: IlpPrepare, sentCallback?: (error?: Error) => void): Promise<IlpReply>;
    private _handleRequest;
}
export declare function writeIlpHttpRequest(client: http.ClientHttp2Session, request: IlpPrepare, sentCallback?: (error?: Error) => void): Promise<IlpReply>;
export declare function readIlpHttpRequest(request: http.Http2ServerRequest): Promise<IlpPrepare>;
export declare function writeIlpHttpResponse(response: http.Http2ServerResponse, reply: IlpReply, sentCallback?: (error?: Error) => void): void;
export {};
