import { Worker } from './index'

const worker = new Worker('svc1', 'tcp://127.0.0.1:4000');

const main = async () => {
  await worker.start()
  await worker.stop()
}

main()