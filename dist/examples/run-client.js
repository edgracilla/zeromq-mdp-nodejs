"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protobuf = require('protobufjs');
const index_1 = require("../index");
const client = new index_1.Client({
    address: 'tcp://127.0.0.1:4000',
    timeout: 1000 * 15
});
const main = async () => {
    const proto = await protobuf.load('access.proto');
    const ReadParams = proto.lookupType('access.read');
    const payload = {
        _id: 'tester-tester',
        meta: {
            _perm: { readOwned: false },
            _access: { _id: 'accessId' },
            _user: { _id: 'userId', name: 'userName' },
        }
    };
    const errMsg = ReadParams.verify(payload);
    if (errMsg) {
        throw Error(errMsg);
    }
    const msg = ReadParams.create(payload);
    const buf = ReadParams.encode(msg).finish();
    const resp = await client.sendRcv('tu-identity-api', 'access', 'read', buf);
    // const resp = await client.sendRcv('tu-identity-api', 'access', 'testPassSupportedTypes', 'str', '1', 'true', '{"foo":"bar"}')
    console.log(JSON.stringify(resp));
};
// setInterval(main, 1000);
main();
