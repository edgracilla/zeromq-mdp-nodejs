"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Broker = void 0;
const service_1 = __importDefault(require("./service"));
const zeromq_1 = require("zeromq");
const types_1 = require("../types");
const { CLIENT, WORKER } = types_1.Header;
const { READY, REPLY, DISCONNECT, HEARTBEAT } = types_1.Message;
const routerConfig = {
    sendHighWaterMark: 1,
    sendTimeout: 1
};
class Broker {
    constructor(address, options) {
        this.services = new Map();
        this.svcWorkerIndex = new Map();
        this.address = address;
        this.svcConf = options;
        this.socket = new zeromq_1.Router(routerConfig);
        this.logger = options.logger || console;
    }
    async listen() {
        this.logger.info(`Listening on ${this.address}`);
        await this.socket.bind(this.address);
        for await (const [sender, blank, header, ...rest] of this.socket) {
            switch (header.toString()) {
                case CLIENT:
                    this.handleClient(sender, ...rest);
                    break;
                case WORKER:
                    this.handleWorker(sender, ...rest);
                    break;
            }
        }
    }
    handleClient(client, ...rest) {
        const cStrId = client.toString('hex');
        const [serviceBuf, ...req] = rest;
        const svcName = serviceBuf.toString();
        if (!svcName) {
            return this.logger.error(`[${CLIENT}] ${cStrId}.req -> empty service name!`);
        }
        if (!this.services.has(svcName)) {
            this.services.set(svcName, new service_1.default(this.socket, svcName, this.svcConf));
        }
        const service = this.services.get(svcName);
        service.dispatchClientRequest(client, ...req);
    }
    handleWorker(worker, ...rest) {
        const [type, ...req] = rest;
        const msgType = type.toString();
        const wStrId = worker.toString('hex');
        const mightSvcExist = msgType !== READY;
        const svcName = mightSvcExist
            ? this.svcWorkerIndex.get(wStrId)
            : req[0].toString();
        if (!this.services.has(svcName)) {
            this.services.set(svcName, new service_1.default(this.socket, svcName, this.svcConf));
        }
        const service = this.services.get(svcName);
        if (!svcName)
            return this.logger.warn(`Worker ${wStrId} not in worker/service index.`);
        if (!service)
            return this.logger.warn(`Service '${svcName}' not found.`);
        switch (msgType) {
            case READY: {
                service.addWorker(worker);
                this.svcWorkerIndex.set(wStrId, svcName);
                break;
            }
            case REPLY: {
                const [client, blank, rep] = req;
                service.dispatchWorkerReply(worker, client, rep);
                break;
            }
            case HEARTBEAT:
                service.resetWorkerLiveness(wStrId);
                break;
            case DISCONNECT: {
                service.removeWorker(wStrId);
                break;
            }
            default: {
                this.logger.warn(`Invalid worker message type: ${type}`);
            }
        }
    }
    anchorExits() {
        const sigFn = {};
        const SIGNALS = ['SIGHUP', 'SIGINT', 'SIGTERM'];
        SIGNALS.map(signal => {
            sigFn[signal] = async () => {
                await this.socket.close();
                process.removeListener(signal, sigFn[signal]);
            };
            process.on(signal, sigFn[signal]);
        });
    }
}
exports.Broker = Broker;
// zmdp-ms-suite
// zmdp-ms-suite
// zmdp-suite
// zmdp-suite
