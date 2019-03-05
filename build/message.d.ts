/// <reference types="node" />
export interface IlpMessage {
    id: number;
    batch: number;
    payload: Buffer;
}
export declare function isIlpMessage(object: any): object is IlpMessage;
export declare function isRequestMessage(message: Buffer | IlpMessage): boolean;
export declare function isReplyMessage(message: Buffer | IlpMessage): boolean;
export declare function serializeIlpMessage(message: IlpMessage): Buffer;
export declare function deserializeIlpMessage(data: Buffer): IlpMessage;
