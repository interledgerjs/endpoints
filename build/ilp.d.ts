import { IlpPrepare, IlpReply } from 'ilp-packet';
import { StreamEndpoint, StreamEndpointOptions } from './stream-endpoint';
import { RequestHandler } from './request-stream';
import { Endpoint } from './endpoint';
export declare type IlpRequestHander = RequestHandler<IlpPrepare, IlpReply>;
export declare type IlpEndpoint = Endpoint<IlpPrepare, IlpReply>;
export declare type IlpStreamEndpointOptions = StreamEndpointOptions<IlpPrepare, IlpReply>;
export declare class IlpStreamEndpoint extends StreamEndpoint<IlpPrepare, IlpReply> {
    constructor(options?: IlpStreamEndpointOptions);
}
export declare class AddressMappedHandlerProvider {
    constructor(handlers?: Map<string, IlpRequestHander>);
    handlers: Map<string, IlpRequestHander>;
    defaultHandler: IlpRequestHander | undefined;
    handleRequest(request: IlpPrepare): Promise<IlpReply>;
}
