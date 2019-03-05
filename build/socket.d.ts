/// <reference types="node" />
import { Request } from './request';
import { EventEmitter } from 'events';
import { AccountInfo } from './account';
import { Logger } from 'ilp-logger';
import { IlpPrepare, IlpReply } from 'ilp-packet';
import { Socket, AddressInfo } from 'net';
export declare const ILP_TCP_URL_PROTOCOL = "ilp+tcp:";
export declare const ILP_IPC_URL_PROTOCOL = "ilp+ipc:";
export interface IlpSession {
    accountId: string;
    accountInfo: AccountInfo;
    localIlpAddress: string;
    currentBatch: number;
}
export declare class IlpSocket extends EventEmitter {
    protected _log: Logger;
    protected _socket: Socket;
    protected _requestIdsByBatch: Map<number, number>;
    protected _requests: Map<string, Request>;
    protected _requestHandler?: (batch: number, message: IlpPrepare) => Promise<IlpReply>;
    constructor(socket: Socket);
    session?: IlpSession;
    address(): AddressInfo & {
        ilpAddress: string;
    };
    request(message: IlpPrepare, sentCallback?: () => void): Promise<IlpReply>;
    private _nextFrameHeaders;
    private _handleData;
    private _handleRequest;
    private _handleReply;
}
export declare function authenticateWithPeer(socket: IlpSocket, accountId: string, secret: string): Promise<void>;
export declare function createConnection(url: URL, createSession?: (socket: IlpSocket) => Promise<void>): Promise<IlpSocket>;
