/// <reference types="node" />
export interface MessageFrame<Request, Reply> {
    id: number;
    payload: Request | Reply;
}
export declare const MESSAGE_ID_LENGTH = 4;
export declare type MessageFrameTypeGuard<Request, Reply> = (object: any) => object is MessageFrame<Request, Reply>;
export declare type Encoder<Request, Reply> = (object: Request | Reply) => Buffer;
export declare type Decoder<Request, Reply> = (object: Buffer) => Request | Reply;
export declare function isMessageFrame<Request, Reply>(object: any, isRequest: (request: any) => request is Request, isReply: (request: any) => request is Reply): object is MessageFrame<Request, Reply>;
export declare function serializeMessageFrame<Request, Reply>(frame: MessageFrame<Request, Reply>, encode: (payload: Request | Reply) => Buffer): Buffer;
export declare function deserializeMessageFrame<Request, Reply>(data: Buffer, decode: (payload: Buffer) => Request | Reply): MessageFrame<Request, Reply>;
