/// <reference types="node" />
import { Router } from 'zeromq';
declare class Service {
    name: string;
    socket: Router;
    requests: Array<[Buffer, Buffer[]]>;
    constructor(socket: Router, name: string);
    dispatchRequest(client: Buffer, ...req: Buffer[]): void;
}
export default Service;
