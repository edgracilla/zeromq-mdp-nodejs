import { Worker } from './index'

const worker = new Worker('svc1', 'tcp://127.0.0.1:4000');

// --

const createFn = (...params: any) => {
  return `createFn: ${params}`
}

const readFn = (...params: any) => {
  return `readFn: ${params}`
}

const updateFn = (...params: any) => {
  return `updateFn: ${params}`
}

const deleteFn = (...params: any) => {
  return `deleteFn: ${params}`
}

// --

const main = async () => {
  worker.injectAction(createFn)
  worker.injectAction(readFn)
  worker.injectAction(updateFn)
  worker.injectAction(deleteFn)

  await worker.start()
  
}

main()

// --

// -- app exit handler

const sigFn: { [key: string ] : any } = {}
const SIGNALS = ['SIGHUP', 'SIGINT', 'SIGTERM'] as const

SIGNALS.map(signal => {
  sigFn[signal] = async () => {
    await worker.stop()
    process.removeListener(signal, sigFn[signal])
  }

  process.on(signal, sigFn[signal])
})
