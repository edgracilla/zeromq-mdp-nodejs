/// <reference types="node" />
import Service from './broker/service';
import { Router } from 'zeromq';
declare class Broker {
    socket: Router;
    address: string;
    workers: Map<string, Buffer>;
    services: Map<string, Service>;
    constructor(address?: string);
    listen(): Promise<void>;
    private handleClient;
    private getService;
}
export default Broker;
