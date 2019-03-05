import * as WebSocket from 'ws';
import { IlpEndpoint, IlpStreamEndpointOptions } from './ilp';
export declare function createIlpWebSocketEndpoint(ws: WebSocket, options?: IlpStreamEndpointOptions): IlpEndpoint;
