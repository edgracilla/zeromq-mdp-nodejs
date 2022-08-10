"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const conf = {
    service: 'tu-identity-api',
    address: 'tcp://127.0.0.1:4000',
    heartbeatLiveness: 3,
    heartbeatInterval: 3000
};
const worker = new index_1.Worker(conf);
// --
const access = {
    x: 12,
    create(obj) {
        return `createFn: ${this.x}`;
    },
    read: (_id, meta) => {
        console.log('readFn executed!');
        return `readFn: ${typeof _id} ${typeof meta}`;
    },
    update: (_id, data, meta) => {
        return `updateFn: ${typeof _id} ${typeof data} ${typeof meta}`;
    },
    delete: (_id, meta) => {
        return `deleteFn: ${_id} ${meta}`;
    }
};
// --
const main = async () => {
    const mod = 'access';
    worker.exposeFn(mod, access.create.bind(access));
    worker.exposeFn(mod, access.read.bind(access));
    // worker.exposeFn(mod, module.update)
    // worker.exposeFn(mod, module.delete)
    await worker.start();
};
main();
