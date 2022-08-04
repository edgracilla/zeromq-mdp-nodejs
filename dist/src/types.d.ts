export declare enum Header {
    CLIENT = "MDPC01",
    WORKER = "MDPW01"
}
export declare enum Message {
    READY = "\u0001",
    REQUEST = "\u0002",
    REPLY = "\u0003",
    HEARTBEAT = "\u0004",
    DISCONNECT = "\u0005"
}
export declare enum WorkerResponse {
    RESP_OK = "0"
}
export interface IOptions {
    verbose?: number;
    heartbeatLiveness?: number;
    heartbeatInterval?: number;
    workerRequestTimeout?: number;
}
