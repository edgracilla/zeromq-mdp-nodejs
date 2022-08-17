"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const types_1 = require("../types");
const { WORKER, CLIENT } = types_1.Header;
const { HEARTBEAT, REQUEST } = types_1.Message;
class ServiceWorker extends events_1.default {
    constructor(svcName, socket, wId, options) {
        super();
        this.seq = '';
        this.request = [];
        this.wId = wId;
        this.socket = socket;
        this.svcName = svcName;
        this.wStrId = wId.toString('hex');
        this.logger = options.logger || console;
        this.workerRequestTimeout = options.workerRequestTimeout || 5000;
        this.liveness = this.heartbeatLiveness = options.heartbeatLiveness || 3;
        this.verbose = options.verbose === undefined ? 1 : options.verbose;
        const interval = options.heartbeatInterval || 3000;
        this.beater = setInterval(this.heartbeat.bind(this), interval);
    }
    async cascadeRequest(origin, client, ...req) {
        const cStrId = client.toString('hex');
        const [module, fn] = req;
        this.request.push([client, req]);
        this.seq = (Date.now()).toString(36).substring(4);
        if (this.verbose > 1) {
            this.logger.info(`[${this.seq}] ${this.svcName} casc: ${cStrId}.req -> ${this.wStrId}.${module}.${fn} (${origin})`);
        }
        await this.socket.send([this.wId, null, WORKER, REQUEST, client, null, ...req]);
    }
    async dispatchReply(client, rep) {
        const cStrId = client.toString('hex');
        if (this.verbose > 1) {
            this.logger.info(`[${this.seq}] ${this.svcName} disp: ${cStrId}.req <- ${this.wStrId}.rep`);
        }
        await this.socket.send([client, null, CLIENT, this.svcName, rep]);
        this.request.shift();
        this.seq = '';
    }
    async heartbeat() {
        if (this.liveness > 0) {
            this.liveness--;
            if (!this.socket.closed) {
                await this.socket.send([this.wId, null, WORKER, HEARTBEAT]);
            }
        }
        else {
            this.emit('destroy', this.wId.toString('hex'));
        }
    }
    resetLiveness() {
        this.liveness = this.heartbeatLiveness;
    }
    clearBeater() {
        clearInterval(this.beater);
    }
}
exports.default = ServiceWorker;
