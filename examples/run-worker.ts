import { Worker } from '../index'

const conf = {
  service: 'tu-identity-api',
  address: 'tcp://127.0.0.1:4000',
  heartbeatLiveness: 3,
  heartbeatInterval: 3000
}

const worker = new Worker(conf);

// --

const access = {
  x: 12,
  create (obj: object) {
    return `createFn: ${this.x}`
  },
  read: (_id: string, meta: object) => {
    console.log('readFn executed!')
    return `readFn: ${typeof _id} ${typeof meta}`
  },
  update: (_id: string, data: object, meta: object) => {
    return `updateFn: ${typeof _id} ${typeof data} ${typeof meta}`
  },
  delete: (_id: string, meta: object) => {
    return `deleteFn: ${_id} ${meta}`
  }
}

// --

const main = async () => {
  const mod = 'access'

  worker.exposeFn(mod, access.create.bind(access))
  worker.exposeFn(mod, access.read.bind(access))
  // worker.exposeFn(mod, module.update)
  // worker.exposeFn(mod, module.delete)

  await worker.start()
}

main()
