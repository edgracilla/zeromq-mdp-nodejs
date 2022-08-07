import { Worker } from '../index'

const serviceName = 'tu-identity-api'
const address = 'tcp://127.0.0.1:4000'
const conf = { heartbeatLiveness: 3, heartbeatInterval: 3000 }

const worker = new Worker(serviceName, address, conf);

// --

const createFn = (obj: object) => {
  return `createFn: ${typeof obj}`
}

const readFn = (_id: string, meta: object) => {
  console.log('readFn executed!')
  return `readFn: ${typeof _id} ${typeof meta}`
}

const updateFn = (_id: string, data: object, meta: object) => {
  return `updateFn: ${typeof _id} ${typeof data} ${typeof meta}`
}

const deleteFn = (_id: string, meta: object) => {
  return `deleteFn: ${_id} ${meta}`
}

const testPassSupportedTypes = (str: string, num: number, flag: boolean, obj: object) => {
  console.log(str, num, flag, obj)
  return `testPassSupportedTypes: ${str} ${num} ${flag} ${obj}`
}

// --

const main = async () => {
  const mod = 'access'

  worker.exposeFn(mod, createFn, ['object'])
  worker.exposeFn(mod, readFn, ['string', 'object'])
  worker.exposeFn(mod, updateFn, ['string', 'object', 'object'])
  worker.exposeFn(mod, deleteFn, ['string', 'object'])
  worker.exposeFn(mod, testPassSupportedTypes, ['string', 'number', 'boolean', 'object'])

  await worker.start()
}

main()
