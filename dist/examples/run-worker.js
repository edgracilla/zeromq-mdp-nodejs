"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const serviceName = 'tu-identity-api';
const address = 'tcp://127.0.0.1:4000';
const conf = { heartbeatLiveness: 3, heartbeatInterval: 3000 };
const worker = new index_1.Worker(serviceName, address, conf);
// --
const createFn = (obj) => {
    return `createFn: ${typeof obj}`;
};
const readFn = (_id, meta) => {
    console.log('readFn executed!');
    return `readFn: ${typeof _id} ${typeof meta}`;
};
const updateFn = (_id, data, meta) => {
    return `updateFn: ${typeof _id} ${typeof data} ${typeof meta}`;
};
const deleteFn = (_id, meta) => {
    return `deleteFn: ${_id} ${meta}`;
};
const testPassSupportedTypes = (str, num, flag, obj) => {
    console.log(str, num, flag, obj);
    return `testPassSupportedTypes: ${str} ${num} ${flag} ${obj}`;
};
// --
const main = async () => {
    const mod = 'access';
    worker.exposeFn(mod, createFn);
    worker.exposeFn(mod, readFn);
    worker.exposeFn(mod, updateFn);
    worker.exposeFn(mod, deleteFn);
    worker.exposeFn(mod, testPassSupportedTypes);
    await worker.start();
};
main();
