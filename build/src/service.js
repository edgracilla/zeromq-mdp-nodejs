"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Service {
    constructor(socket, name) {
        this.requests = [];
        this.socket = socket;
        this.name = name;
    }
    dispatchRequest(client, ...req) {
        this.requests.push([client, req]);
        // this.dispatchPending()
    }
}
exports.default = Service;
