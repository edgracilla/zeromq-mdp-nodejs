"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = __importDefault(require("./broker/service"));
const types_1 = require("./types");
const zeromq_1 = require("zeromq");
class Broker {
    constructor(address = 'tcp://127.0.0.1:4000') {
        this.workers = new Map();
        this.services = new Map();
        this.address = address;
        this.socket = new zeromq_1.Router({
            sendHighWaterMark: 1,
            sendTimeout: 1
        });
    }
    async listen() {
        console.log('Listening on:', this.address);
        await this.socket.bind(this.address);
        for await (const [sender, , header, ...rest] of this.socket) {
            console.log('--a', sender);
            switch (header.toString()) {
                case types_1.Header.CLIENT:
                    console.log('--c', header.toString());
                    this.handleClient(sender, ...rest);
                    break;
            }
            console.log('--d', rest.toString());
        }
        console.log('--z');
    }
    handleClient(client, service, ...req) {
        if (service) {
            this.getService(service).dispatchRequest(client, service, ...req);
        }
    }
    getService(name) {
        const key = name.toString();
        if (this.services.has(key)) {
            return this.services.get(key);
        }
        else {
            const svc = new service_1.default(this.socket, key);
            this.services.set(key, svc);
            return svc;
        }
    }
}
exports.default = Broker;
