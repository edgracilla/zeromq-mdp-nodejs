/// <reference types="node" />
import { Router } from 'zeromq';
import { IOptions } from '../types';
import ServiceWorker from './service-worker';
declare class Service {
    name: string;
    socket: Router;
    verbose: number;
    options: IOptions;
    logger: any;
    requests: Array<[Buffer, Buffer[]]>;
    svcWorkers: Map<string, ServiceWorker>;
    unoccupied: Set<string>;
    constructor(socket: Router, name: string, options?: IOptions);
    addWorker(worker: Buffer): void;
    removeWorker(wStrId: string): void;
    dispatchClientRequest(client: Buffer, ...req: Buffer[]): void;
    consumeRequests(origin: string): Promise<void>;
    dispatchWorkerReply(worker: Buffer, client: Buffer, rep: Buffer): Promise<void>;
    resetWorkerLiveness(wStrId: string): any;
}
export default Service;
