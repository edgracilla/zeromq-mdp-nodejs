"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zmdp_protocoder_1 = __importDefault(require("zmdp-protocoder"));
const index_1 = require("../index");
const zpc = new zmdp_protocoder_1.default('./examples/zproto');
const client = new index_1.Client({
    address: 'tcp://127.0.0.1:4000',
    timeout: 1000 * 15
});
const mod = 'access';
const svc = 'tu-identity-api';
const payload = {
    _id: 'tester-tester',
    meta: {
        _perm: { readOwned: false },
        _access: { _id: 'accessId' },
        _user: { _id: 'userId', name: 'userName' },
    }
};
const main = async () => {
    const buf = await zpc.paramEncode(mod, 'read', payload);
    const resp = await client.sendRcv(svc, mod, 'read', buf);
    if (resp) {
        const { result } = await zpc.resultDecode(mod, 'read', resp);
        console.log('--a', result, '--b');
    }
    // const resp = await client.sendRcv('tu-identity-api', 'access', 'testPassSupportedTypes', 'str', '1', 'true', '{"foo":"bar"}')
};
// setInterval(main, 1000);
main();
