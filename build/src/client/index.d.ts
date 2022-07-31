import { Request } from 'zeromq';
interface ClientOption {
    address: string;
    timeout?: number;
    retry?: number;
}
declare class Client {
    socket: Request;
    address: string;
    timeout: number;
    retry: number;
    request: Array<[string, string, string[]]>;
    constructor(option: ClientOption);
    sendRcv(service: string, fn: string, ...params: string[]): Promise<string | undefined>;
    sendRcv2(service: string, fn: string, ...params: string[]): Promise<string | undefined>;
}
export default Client;
