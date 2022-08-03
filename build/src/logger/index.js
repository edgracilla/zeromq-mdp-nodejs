"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const conf = {
    transport: {
        target: 'pino-pretty',
        options: { translateTime: true }
    }
};
// TODO: disable pretty in prod
const logger = require('pino')(conf); // require??
exports.default = logger;
