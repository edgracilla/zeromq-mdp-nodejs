"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
const logger_1 = __importDefault(require("../logger"));
const protobuf = require('protobufjs');
const zeromq_1 = require("zeromq");
const types_1 = require("../types");
const { WORKER } = types_1.Header;
const { READY, REPLY, DISCONNECT, HEARTBEAT, REQUEST } = types_1.Message;
class Worker {
    constructor(config) {
        this.actions = new Map();
        this.address = config.address;
        this.svcName = config.service;
        this.protoSrc = config.protoSrc || '.';
        this.heartbeatInterval = config.heartbeatInterval || 3000;
        this.liveness = this.heartbeatLiveness = config.heartbeatLiveness || 3;
        this.socket = new zeromq_1.Dealer();
        this.anchorExits();
    }
    async start(recon = false) {
        if (!this.actions.size) {
            throw new Error('Atleast one (1) worker action is required.');
        }
        this.socket = new zeromq_1.Dealer({ linger: 1 });
        this.liveness = this.heartbeatLiveness;
        await this.socket.connect(this.address);
        await this.socket.send([null, WORKER, READY, this.svcName]);
        this.beater = setInterval(this.heartbeat.bind(this), this.heartbeatInterval);
        logger_1.default.info(`${recon ? 'Reconnect: ' : ''}[${this.svcName}] ZMDP Worker started.`);
        for await (const [blank, header, type, client, blank2, ...req] of this.socket) {
            this.liveness = this.heartbeatLiveness;
            switch (type.toString()) {
                case REQUEST:
                    this.handleClientRequest(client, ...req);
                    break;
                case HEARTBEAT:
                    break;
                // case DISCONNECT:
                // TODO: handle disconnect
                // break;
            }
        }
    }
    async handleClientRequest(client, ...req) {
        const rep = await this.process(client, ...req);
        try {
            await this.socket.send([null, WORKER, REPLY, client, null, rep]);
        }
        catch (err) {
            console.log(err);
            console.error(`unable to send reply for ${this.address}`);
        }
    }
    async heartbeat() {
        if (this.liveness > 0) {
            this.liveness--;
            await this.socket.send([null, WORKER, HEARTBEAT]);
        }
        else {
            if (this.beater) {
                clearInterval(this.beater);
            }
            this.socket.close();
            await this.start(true);
        }
    }
    async stop() {
        logger_1.default.info(`[${this.svcName}] worker closed.`);
        if (this.beater) {
            clearInterval(this.beater);
        }
        if (!this.socket.closed) {
            await this.socket.send([null, WORKER, DISCONNECT]);
            this.socket.close();
        }
    }
    exposeFn(module, action) {
        console.log(`${module}.${action.name.replace(/bound /i, '')}`, action);
        this.actions.set(`${module}.${action.name.replace(/bound /i, '')}`, action);
    }
    async process(client, ...req) {
        const [module, fn, ...params] = req;
        const strFn = fn.toString();
        const strModule = module.toString();
        const strClient = client.toString('hex');
        const action = this.actions.get(`${strModule}.${strFn}`);
        if (!action) {
            logger_1.default.warn(`${this.svcName}.${fn}() not found.`);
        }
        else {
            logger_1.default.info(`[${strClient}] ${this.svcName}.${module}.${fn}()`);
            // -- POC only
            const root = await protobuf.load(`${this.protoSrc}/${module}.proto`);
            const Proto = root.lookupType(`${module}.${strFn}`);
            const msg = Proto.decode(params[0]);
            const msgObj = Proto.toObject(msg);
            const paramData = Object.keys(msgObj).map(key => msgObj[key]);
            console.log('--x', msgObj);
            // --
            return await action(...paramData);
        }
    }
    anchorExits() {
        const sigFn = {};
        const SIGNALS = ['SIGHUP', 'SIGINT', 'SIGTERM'];
        SIGNALS.map(signal => {
            sigFn[signal] = async () => {
                await this.stop();
                process.removeListener(signal, sigFn[signal]);
            };
            process.on(signal, sigFn[signal]);
        });
    }
}
exports.Worker = Worker;
