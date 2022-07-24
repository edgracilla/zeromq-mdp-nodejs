import { Broker } from './index'

const broker = new Broker('tcp://127.0.0.1:4000');

broker.listen()

// -- app exit handler

const sigFn: { [key: string ] : any } = {}
const SIGNALS = ['SIGHUP', 'SIGINT', 'SIGTERM'] as const

SIGNALS.map(signal => {
  sigFn[signal] = async () => {
    await broker.socket.close()
    process.removeListener(signal, sigFn[signal])
  }

  process.on(signal, sigFn[signal])
})
