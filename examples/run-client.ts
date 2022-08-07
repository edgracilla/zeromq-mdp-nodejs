const protobuf = require('protobufjs')
import { Client } from '../index'

const client = new Client({
  address: 'tcp://127.0.0.1:4000',
  timeout: 1000 * 15
});

const main = async () => {
  const proto = await protobuf.load('test.proto')
  const ReadParams = proto.lookupType('samplepkg.readFn')

  const payload = {
    _id: 'test',
    meta: {
      _perm: { readOwned: true },
      _access: { _id: 'accessId' },
      _user: { _id: 'userId', name: 'userName' },
    }
  }

  const errMsg = ReadParams.verify(payload)

  if (errMsg) {
    throw Error(errMsg)
  }

  const msg = ReadParams.create(payload)
  const buf = ReadParams.encode(msg).finish()

  const resp = await client.sendRcv('tu-identity-api', 'access', 'readFn', buf)

  // const resp = await client.sendRcv('tu-identity-api', 'access', 'testPassSupportedTypes', 'str', '1', 'true', '{"foo":"bar"}')

  if (resp) {
    console.log(resp)
  }
}

// setInterval(main, 1000);
main()