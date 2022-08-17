/// <reference types="node" />
/// <reference types="node" />
import EventEmitter from 'events';
import { Router } from 'zeromq';
import { IOptions } from '../types';
declare class ServiceWorker extends EventEmitter {
    wId: Buffer;
    wStrId: string;
    socket: Router;
    svcName: string;
    logger: any;
    seq: string;
    verbose: number;
    liveness: number;
    heartbeatLiveness: number;
    workerRequestTimeout: number;
    beater: ReturnType<typeof setInterval>;
    request: Array<[Buffer, Buffer[]]>;
    constructor(svcName: string, socket: Router, wId: Buffer, options: IOptions);
    cascadeRequest(origin: string, client: Buffer, ...req: Buffer[]): Promise<void>;
    dispatchReply(client: Buffer, rep: Buffer): Promise<void>;
    heartbeat(): Promise<void>;
    resetLiveness(): void;
    clearBeater(): void;
}
export default ServiceWorker;
