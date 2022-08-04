"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const serviceName = 'tu-identity-api';
const address = 'tcp://127.0.0.1:4000';
const conf = { heartbeatLiveness: 3, heartbeatInterval: 3000 };
const worker = new index_1.Worker(serviceName, address, conf);
// const ws = new WorkerSquire()
// const ws = new Squire()
// --
const createFn = (...params) => {
    return `createFn: ${params}`;
};
const readFn = (...params) => {
    return `readFn: ${params}`;
};
const updateFn = (...params) => {
    return `updateFn: ${params}`;
};
const deleteFn = (...params) => {
    return `deleteFn: ${params}`;
};
// --
const main = async () => {
    const mod = 'access';
    worker.exposeFn(mod, createFn);
    worker.exposeFn(mod, readFn);
    worker.exposeFn(mod, updateFn);
    worker.exposeFn(mod, deleteFn);
    await worker.start();
};
main();
