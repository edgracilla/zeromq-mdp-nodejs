"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const serviceName = 'tu-identity-api';
const address = 'tcp://127.0.0.1:4000';
const conf = {
    service: 'tu-identity-api',
    address: 'tcp://127.0.0.1:4000',
    heartbeatLiveness: 3,
    heartbeatInterval: 3000
};
const worker = new index_1.Worker(conf);
// --
const create = (obj) => {
    return `createFn: ${typeof obj}`;
};
const read = (_id, meta) => {
    console.log('readFn executed!');
    return `readFn: ${typeof _id} ${typeof meta}`;
};
const update = (_id, data, meta) => {
    return `updateFn: ${typeof _id} ${typeof data} ${typeof meta}`;
};
// const delete = (_id: string, meta: object) => {
//   return `deleteFn: ${_id} ${meta}`
// }
const testPassSupportedTypes = (str, num, flag, obj) => {
    console.log(str, num, flag, obj);
    return `testPassSupportedTypes: ${str} ${num} ${flag} ${obj}`;
};
// --
const main = async () => {
    const mod = 'access';
    worker.exposeFn(mod, create);
    worker.exposeFn(mod, read);
    worker.exposeFn(mod, update);
    // worker.exposeFn(mod, deleteFn)
    worker.exposeFn(mod, testPassSupportedTypes);
    await worker.start();
};
main();
