/// <reference types="node" />
import { IlpPrepare, IlpFulfill, IlpReject } from 'ilp-packet';
export interface FrameHeaders {
    id: number;
    batch: number;
}
export declare type Frame = RequestFrame | ResponseFrame | ErrorFrame;
export declare type RequestFrame = FrameHeaders & IlpPrepare;
export declare type ResponseFrame = FrameHeaders & IlpFulfill;
export declare type ErrorFrame = FrameHeaders & IlpReject;
export declare type ReplyFrame = ResponseFrame | ErrorFrame;
export declare function isRequest(packet: FrameHeaders): packet is RequestFrame;
export declare function isReply(packet: FrameHeaders): packet is ReplyFrame;
export declare function serializeFrame(frame: Frame): Buffer;
export declare function deserializeFrame(data: Buffer): Frame;
