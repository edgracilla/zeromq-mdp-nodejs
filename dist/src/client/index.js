"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const logger_1 = __importDefault(require("../logger"));
const zeromq_1 = require("zeromq");
const types_1 = require("../types");
const { CLIENT } = types_1.Header;
class Client {
    constructor(option) {
        this.request = [];
        const { address, timeout, retry } = option;
        const context = new zeromq_1.Context({
            blocky: false
        });
        this.retry = retry || 3;
        this.timeout = timeout || 1000 * 10;
        this.address = address;
        this.socket = new zeromq_1.Request({
            receiveTimeout: this.timeout,
            linger: 1,
            context
        });
        this.socket.connect(address);
    }
    async sendRcv(service, module, fn, params) {
        await this.socket.send([CLIENT, service, module, fn, params]);
        try {
            const [header, service, resp] = await this.socket.receive();
            console.log('--a', resp);
            return resp.toString();
        }
        catch (err) {
            logger_1.default.error(err);
        }
    }
    async sendRcv2(service, fn, ...params) {
        let tries = 0;
        await this.socket.send([CLIENT, service, fn, ...params]);
        while (tries < this.retry) {
            try {
                const [header, service, status, resp] = await this.socket.receive();
                console.log('--a', header.toString(), service.toString(), status.toString(), resp.toString());
                return resp.toString();
            }
            catch (err) {
                console.log(err);
                logger_1.default.warn(`Timeout: calling service '${service}' x${tries + 1} (${this.timeout / 1000}s)`);
            }
            tries++;
        }
        logger_1.default.error(`Client REQ failed: ${this.retry} retries consumed`);
    }
}
exports.Client = Client;
