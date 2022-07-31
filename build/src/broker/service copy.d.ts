/// <reference types="node" />
import { Router } from 'zeromq';
interface IWorkerStruct {
    id: Buffer;
    liveness: number;
}
interface IServiceOptions {
    heartbeatLiveness?: number;
    heartbeatInterval?: number;
}
declare class Service {
    name: string;
    socket: Router;
    interval: number;
    liveness: number;
    workers: Map<string, IWorkerStruct>;
    requests: Array<[Buffer, Buffer[]]>;
    constructor(socket: Router, name: string, opts?: IServiceOptions);
    addWorker(worker: Buffer): void;
    removeWorker(wStrId: string): void;
    dispatchRequest(client: Buffer, ...req: Buffer[]): void;
    dispatchReply(worker: Buffer, client: Buffer, rep: Buffer): Promise<void>;
    consumeRequests(): Promise<void>;
    logInfo(log: string): void;
    resetLiveness(wStrId: string): any;
}
export default Service;
