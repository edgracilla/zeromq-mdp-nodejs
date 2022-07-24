import { Client } from './index'

const client = new Client({
  address: 'tcp://127.0.0.1:4000',
  timeout: 3000
});

const main = async () => {
  const resp = await client.sendRcv('svc1', 'createFn', 'aa', 'bb', 'cc')

  if (resp) {
    console.log(resp)
  }
}

main()