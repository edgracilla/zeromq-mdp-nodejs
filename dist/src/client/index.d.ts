/// <reference types="node" />
import { Request } from 'zeromq';
interface ClientOption {
    address: string;
    timeout?: number;
    retry?: number;
    logger?: any;
}
export declare class Client {
    logger: any;
    socket: Request;
    address: string;
    timeout: number;
    retry: number;
    request: Array<[string, string, string[]]>;
    constructor(options: ClientOption);
    sendRcv(service: string, module: string, fn: string, params: Buffer): Promise<string | undefined>;
    sendRcv2(service: string, fn: string, ...params: string[]): Promise<string | undefined>;
}
export {};
