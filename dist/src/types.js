"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerResponse = exports.Message = exports.Header = void 0;
var Header;
(function (Header) {
    Header["CLIENT"] = "MDPC01";
    Header["WORKER"] = "MDPW01";
})(Header = exports.Header || (exports.Header = {}));
var Message;
(function (Message) {
    Message["READY"] = "\u0001";
    Message["REQUEST"] = "\u0002";
    Message["REPLY"] = "\u0003";
    Message["HEARTBEAT"] = "\u0004";
    Message["DISCONNECT"] = "\u0005";
})(Message = exports.Message || (exports.Message = {}));
var WorkerResponse;
(function (WorkerResponse) {
    WorkerResponse["RESP_OK"] = "0";
    // ERR_ZERO_WORKER = '1',
    // RESP_TIMEOUT = '2'
})(WorkerResponse = exports.WorkerResponse || (exports.WorkerResponse = {}));
