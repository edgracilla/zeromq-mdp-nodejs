import logger from '../logger'
import ServiceWorker from './service-worker'

import { Router } from 'zeromq'
import { Header, Message, WorkerResponse } from '../types'

const { CLIENT } = Header

export interface IServiceOptions {
  heartbeatLiveness?: number
  heartbeatInterval?: number
  workerRequestTimeout?: number
}

class Service {
  name: string
  socket: Router
  options: IServiceOptions

  requests: Array<[Buffer, Buffer[]]> = []
  svcWorkers: Map<string, ServiceWorker> = new Map()
  unoccupied: Set<string> = new Set()

  constructor (socket: Router, name: string, options: IServiceOptions = {}) {
    this.name = name
    this.socket = socket
    this.options = options
  }

  addWorker(worker: Buffer) {
    const wStrId = worker.toString('hex')
    const sWorker = this.svcWorkers.get(wStrId)!

    if (sWorker) {
      // paranoia, this might happen? if this happens, do not recreate SW as it
      // resets beater and might halt running operations
      logger.warn(`Adding worker that is already exist! ${wStrId}`)
    } else {
      const nWorker = new ServiceWorker(this.name, this.socket, worker, this.options)

      nWorker.on('destroy', this.removeWorker.bind(this))

      this.svcWorkers.set(wStrId, nWorker)
      this.unoccupied.add(wStrId)

      this.logInfo(`worker added: ${wStrId} (${this.unoccupied.size}/${this.svcWorkers.size})`)
      this.consumeRequests('ADW')
    }
  }

  removeWorker(wStrId: string) {
    const sWorker = this.svcWorkers.get(wStrId)!

    if (sWorker) {
      if (sWorker.request.length) {
        const [client, req] = sWorker.request.shift()!
        this.requests.push([client, req])
      }

      sWorker.clearBeater()
    }

    const deleted = this.svcWorkers.delete(wStrId)

    if (deleted) {
      this.unoccupied.delete(wStrId)
    } else {
      // TODO: handle occupied worker deletion
      // wait till worker process done? or force delete?
      logger.error('-- svc worker rmv failed!')
    }

    this.logInfo(`worker rmved: ${wStrId} (${this.unoccupied.size}/${this.svcWorkers.size})`)

    this.consumeRequests('RMW')
  }

  dispatchClientRequest(client: Buffer, ...req: Buffer[]) {
    // logger.info(`[${CLIENT}] ${client.toString('hex')}.req -> ${this.name}.${req[0].toString()}()`)

    this.requests.push([client, req])
    this.consumeRequests('DCR')
  }

  async consumeRequests(origin: string) {
    while (this.svcWorkers.size && this.requests.length && this.unoccupied.size) {
      const [key, wStrId] = this.unoccupied.entries().next().value!
      const [client, req] = this.requests.shift()!
      
      this.unoccupied.delete(wStrId)

      const sWorker = this.svcWorkers.get(wStrId)!
      await sWorker.cascadeRequest(origin, client, ...req);
    }
  }

  async dispatchWorkerReply(worker: Buffer, client: Buffer, rep: Buffer) {
    const wStrId = worker.toString('hex')
    const sWorker = this.svcWorkers.get(wStrId)!

    await sWorker.dispatchReply(client, rep)

    this.unoccupied.add(wStrId)
    this.consumeRequests('DWR')
  }

  logInfo (log: string) {
    logger.info(`[${this.name}] ${log}`)
  }

  resetWorkerLiveness (wStrId: string) {
    const sWorker = this.svcWorkers.get(wStrId)!

    if (!sWorker) {
      return logger.warn(`Unable to reset liveness! missing worker ${wStrId}`)
    }

    sWorker.resetLiveness()
  }
}

export default Service