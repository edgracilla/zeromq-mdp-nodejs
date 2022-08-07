/// <reference types="node" />
import { Dealer } from 'zeromq';
interface IWorkerOption {
    heartbeatInterval?: number;
    heartbeatLiveness?: number;
}
export declare class Worker {
    socket: Dealer;
    address: string;
    svcName: string;
    beater: any;
    liveness: number;
    heartbeatLiveness: number;
    heartbeatInterval: number;
    functions: Map<string, [Function, string[]]>;
    constructor(svcName: string, address: string, opts?: IWorkerOption);
    start(recon?: boolean): Promise<void>;
    handleClientRequest(client: Buffer, ...req: Buffer[]): Promise<void>;
    heartbeat(): Promise<void>;
    stop(): Promise<void>;
    exposeFn(module: string, action: Function, types: string[]): void;
    process(client: Buffer, ...req: Buffer[]): Promise<any>;
    anchorExits(): void;
}
export {};
