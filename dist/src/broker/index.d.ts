/// <reference types="node" />
import Service from './service';
import { Router } from 'zeromq';
import { IOptions } from '../types';
export declare class Broker {
    logger: any;
    socket: Router;
    address: string;
    svcConf: IOptions;
    services: Map<string, Service>;
    svcWorkerIndex: Map<string, string>;
    constructor(address: string, options: IOptions);
    listen(): Promise<void>;
    handleClient(client: Buffer, ...rest: Buffer[]): any;
    handleWorker(worker: Buffer, ...rest: Buffer[]): any;
    anchorExits(): void;
}
