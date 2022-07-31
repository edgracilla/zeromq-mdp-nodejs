"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../logger"));
const types_1 = require("../types");
const { REQUEST } = types_1.Message;
const { CLIENT, WORKER } = types_1.Header;
class Service {
    constructor(socket, name, opts = {}) {
        this.workers = new Map();
        this.requests = [];
        this.name = name;
        this.socket = socket;
        this.liveness = opts.heartbeatLiveness || 3;
        this.interval = opts.heartbeatInterval || 3000;
    }
    addWorker(worker) {
        const wStrId = worker.toString('hex');
        const wStruct = {
            liveness: 3,
            id: worker,
        };
        this.logInfo(`addWorker: ${wStrId} (${this.workers.size + 1})`);
        this.workers.set(wStrId, wStruct);
        this.consumeRequests();
    }
    removeWorker(wStrId) {
        this.logInfo(`rmvWorker: ${wStrId}`);
        this.workers.delete(wStrId);
        this.consumeRequests();
    }
    dispatchRequest(client, ...req) {
        this.requests.push([client, req]);
        this.consumeRequests();
    }
    async dispatchReply(worker, client, rep) {
        const wStrId = worker.toString('hex');
        const cStrId = client.toString('hex');
        const wStruct = {
            liveness: 3,
            id: worker,
        };
        this.logInfo(`dispatch: ${cStrId}.req <- ${wStrId}.rep`);
        this.workers.set(wStrId, wStruct);
        await this.socket.send([client, null, CLIENT, this.name, rep]);
        this.consumeRequests();
    }
    async consumeRequests() {
        while (this.workers.size && this.requests.length) {
            const [key, wStruct] = this.workers.entries().next().value;
            const [client, req] = this.requests.shift();
            this.workers.delete(key);
            const [fn] = req;
            const wStrId = wStruct.id.toString('hex');
            const cStrId = client.toString('hex');
            this.logInfo(`consumes: ${cStrId}.req -> ${wStrId}.${fn}`);
            await this.socket.send([wStruct.id, null, WORKER, REQUEST, client, null, ...req]);
        }
    }
    logInfo(log) {
        logger_1.default.info(`[${this.name}] ${log}`);
    }
    resetLiveness(wStrId) {
        const wStruct = this.workers.get(wStrId);
        if (!wStruct) {
            return logger_1.default.warn(`Unable to reset liveness! missing worker ${wStrId}`);
        }
        wStruct.liveness = this.liveness;
        this.workers.set(wStrId, wStruct);
    }
}
exports.default = Service;
