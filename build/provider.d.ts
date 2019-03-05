import { RequestHandler } from './endpoint';
import { IlpPrepare } from 'ilp-packet';
export declare class AddressMappedHandlerProvider {
    constructor(handlers?: Map<string, RequestHandler>);
    handlers: Map<string, RequestHandler>;
    defaultHandler: RequestHandler | undefined;
    provideHandler(request: IlpPrepare): RequestHandler | undefined;
}
