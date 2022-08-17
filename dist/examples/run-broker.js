"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const svcConf = {
    verbose: 2,
    heartbeatLiveness: 3,
    heartbeatInterval: 3000,
    workerRequestTimeout: 5000,
    logger: console
};
const broker = new index_1.Broker('tcp://127.0.0.1:4000', svcConf);
broker.listen();
