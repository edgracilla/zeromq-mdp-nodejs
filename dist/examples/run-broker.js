"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const index_1 = require("../index");
const conf = {
    transport: {
        target: 'pino-pretty',
        options: { translateTime: true }
    }
};
const svcConf = {
    verbose: 2,
    heartbeatLiveness: 3,
    heartbeatInterval: 3000,
    workerRequestTimeout: 5000,
    logger: (0, pino_1.default)(conf)
};
const broker = new index_1.Broker('tcp://127.0.0.1:4000', svcConf);
broker.listen();
