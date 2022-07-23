import { Client } from './index'

const client = new Client({
  address: 'tcp://127.0.0.1:4000',
  timeout: 2000
});

client.send('svc1', 'createFn', 'aa', 'bb', 'cc')