"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
const zeromq_1 = require("zeromq");
const types_1 = require("../types");
const { WORKER } = types_1.Header;
const { READY, REPLY, DISCONNECT, HEARTBEAT, REQUEST } = types_1.Message;
class Worker {
    constructor(config) {
        this._paramDecoder = async () => { };
        this._resultEncoder = async () => { };
        this.actions = new Map();
        this.address = config.address;
        this.svcName = config.service;
        this.protoSrc = config.protoSrc || '.';
        this.logger = config.logger || console;
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
        this.logger.info(`${recon ? 'Reconnect: ' : ''}[${this.svcName}] ZMDP Worker started.`);
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
        const rep = await this.triggerAction(client, ...req);
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
        this.logger.info(`[${this.svcName}] worker closed.`);
        if (this.beater) {
            clearInterval(this.beater);
        }
        if (!this.socket.closed) {
            await this.socket.send([null, WORKER, DISCONNECT]);
            this.socket.close();
        }
    }
    exposeFn(module, action) {
        this.actions.set(`${module}.${action.name.replace(/bound /i, '')}`, action);
    }
    async triggerAction(client, ...req) {
        const [module, fn, ...params] = req;
        const strFn = fn.toString();
        const strModule = module.toString();
        const strClient = client.toString('hex');
        const action = this.actions.get(`${strModule}.${strFn}`);
        if (!action) {
            this.logger.warn(`${this.svcName}.${fn}() not found.`);
        }
        else {
            this.logger.info(`[${strClient}] ${this.svcName}.${module}.${fn}()`);
            try {
                const paramData = await this._paramDecoder(module, strFn, params) || params;
                const result = await action(...paramData);
                const encodedResult = await this._resultEncoder(module, strFn, result) || result;
                return encodedResult;
            }
            catch (err) {
                this.logger.warn(`[zWorker Err]`);
                this.logger.error(err);
                // TODO: reply error. how? on mdp
            }
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
    // -- expiremental
    setParamDecoder(fn) {
        this._paramDecoder = fn;
    }
    setResultEncoder(fn) {
        this._resultEncoder = fn;
    }
}
exports.Worker = Worker;
