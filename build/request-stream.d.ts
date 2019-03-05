export declare type RequestHandler<Request, Reply> = (request: Request) => Promise<Reply>;
export declare function pipeline<Request, Reply>(...bidirectionalDuplexes: BidirectionalDuplexRequestStream<Request, Reply>[]): BidirectionalDuplexRequestStream<Request, Reply>;
export interface BidirectionalDuplexRequestStream<Request, Reply> {
    incoming: DuplexRequestStream<Request, Reply>;
    outgoing: DuplexRequestStream<Request, Reply>;
}
export interface ReadableRequestStream<Request, Reply> {
    pipe: (writable: WritableRequestStream<Request, Reply>) => this;
    unpipe: () => this;
}
export interface WritableRequestStream<Request, Reply> {
    write: RequestHandler<Request, Reply>;
}
export declare type DuplexRequestStream<Request, Reply> = ReadableRequestStream<Request, Reply> & WritableRequestStream<Request, Reply>;
