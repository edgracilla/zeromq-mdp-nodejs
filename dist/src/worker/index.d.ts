/// <reference types="node" />
import { Dealer } from 'zeromq';
interface IWorkerOption {
    service: string;
    address: string;
    protoSrc?: string;
    heartbeatInterval?: number;
    heartbeatLiveness?: number;
    logger?: any;
}
export declare class Worker {
    logger: any;
    socket: Dealer;
    address: string;
    svcName: string;
    protoSrc: string;
    beater: any;
    liveness: number;
    heartbeatLiveness: number;
    heartbeatInterval: number;
    _paramDecoder: Function;
    _resultEncoder: Function;
    actions: Map<string, Function>;
    constructor(config: IWorkerOption);
    start(recon?: boolean): Promise<void>;
    handleClientRequest(client: Buffer, ...req: Buffer[]): Promise<void>;
    heartbeat(): Promise<void>;
    stop(): Promise<void>;
    exposeFn(module: string, action: Function): void;
    triggerAction(client: Buffer, ...req: Buffer[]): Promise<any>;
    anchorExits(): void;
    setParamDecoder(fn: Function): void;
    setResultEncoder(fn: Function): void;
}
export {};
