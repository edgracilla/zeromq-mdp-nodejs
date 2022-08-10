import { Worker } from '../index'

const serviceName = 'tu-identity-api'
const address = 'tcp://127.0.0.1:4000'

const conf = {
  service: 'tu-identity-api',
  address: 'tcp://127.0.0.1:4000',
  heartbeatLiveness: 3,
  heartbeatInterval: 3000
}

const worker = new Worker(conf);

// --

const create = (obj: object) => {
  return `createFn: ${typeof obj}`
}

const read = (_id: string, meta: object) => {
  console.log('readFn executed!')
  return `readFn: ${typeof _id} ${typeof meta}`
}

const update = (_id: string, data: object, meta: object) => {
  return `updateFn: ${typeof _id} ${typeof data} ${typeof meta}`
}

// const delete = (_id: string, meta: object) => {
//   return `deleteFn: ${_id} ${meta}`
// }

const testPassSupportedTypes = (str: string, num: number, flag: boolean, obj: object) => {
  console.log(str, num, flag, obj)
  return `testPassSupportedTypes: ${str} ${num} ${flag} ${obj}`
}

// --

const main = async () => {
  const mod = 'access'

  worker.exposeFn(mod, create)
  worker.exposeFn(mod, read)
  worker.exposeFn(mod, update)
  // worker.exposeFn(mod, deleteFn)
  worker.exposeFn(mod, testPassSupportedTypes)

  await worker.start()
}

main()
