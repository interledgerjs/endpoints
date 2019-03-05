import { RequestHandler } from './request-stream';
export interface Endpoint<Request, Reply> {
    sendOutgoingRequest: (request: Request, sentCallback?: () => void) => Promise<Reply>;
    setIncomingRequestHandler: (handler: RequestHandler<Request, Reply>) => this;
}
