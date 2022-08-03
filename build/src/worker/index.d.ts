/// <reference types="node" />
import { Dealer } from 'zeromq';
interface IWorkerOption {
    heartbeatInterval?: number;
    heartbeatLiveness?: number;
}
export declare class Worker {
    group: string;
    socket: Dealer;
    address: string;
    beater: any;
    liveness: number;
    heartbeatLiveness: number;
    heartbeatInterval: number;
    actions: Map<string, Function>;
    constructor(group: string, address: string, opts?: IWorkerOption);
    start(recon?: boolean): Promise<void>;
    handleClientRequest(client: Buffer, ...req: Buffer[]): Promise<void>;
    heartbeat(): Promise<void>;
    stop(): Promise<void>;
    exposeFn(action: Function): void;
    process(client: Buffer, ...req: Buffer[]): Promise<any>;
    anchorExits(): void;
}
export {};
