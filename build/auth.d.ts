/// <reference types="node" />
import { AccountInfo } from './account';
import { IlpEndpoint, RequestHandler } from './endpoint';
import { IlpTransport } from './transport';
import { IlpSession } from './session';
export declare const ILP_TLS_URL_PROTOCOL = "ilp+tls:";
export declare const ILP_TCP_URL_PROTOCOL = "ilp+tcp:";
export declare const ILP_IPC_URL_PROTOCOL = "ilp+ipc:";
export interface AuthOptions {
    authProtocol: string;
    authCondition: Buffer;
    authData: Buffer;
    authTimeout?: Date;
}
export interface AuthResponse {
    accountId: string;
    accountInfo: AccountInfo;
    address: string;
}
export declare function createBasicAuth(username: string, password: string, expiryMs: number): AuthOptions;
export declare function deserializeAuth(data: Buffer): AuthResponse;
export declare type IlpSessionAuthenticator = (endpoint: IlpEndpoint) => Promise<IlpSession>;
export declare function authenticate(endpoint: IlpEndpoint, options: AuthOptions): Promise<IlpSession>;
export declare function createSession(url: URL, requestHandler: RequestHandler): Promise<IlpTransport>;
