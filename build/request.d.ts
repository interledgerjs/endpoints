import { RequestFrame, ReplyFrame } from './packet';
export declare class Request {
    private _timer;
    private _request;
    private _responseCallback;
    constructor(frame: RequestFrame, responseCallback: (response: ReplyFrame) => void, timeoutCallback: () => void);
    responseReceived(response: ReplyFrame): void;
}
