"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const client = new index_1.Client({
    address: 'tcp://127.0.0.1:4000',
    timeout: 1000 * 15
});
const main = async () => {
    const resp = await client.sendRcv('tu-identity-api', 'access', 'createFn', 'aa', 'bb', 'cc');
    if (resp) {
        console.log(resp);
    }
};
setInterval(main, 1000);
// main()
