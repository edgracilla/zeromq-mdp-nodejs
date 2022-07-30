import logger from '../logger'
import ServiceWorker from './service-worker'

import { Router } from 'zeromq'
import { Header, Message, WorkerResponse } from '../types'

const { REQUEST } = Message
const { CLIENT, WORKER } = Header
const { RESP_OK, ERR_ZERO_WORKER } = WorkerResponse

interface IServiceOptions {
  heartbeatLiveness?: number
  heartbeatInterval?: number
}

class Service {
  name: string
  socket: Router
  options: IServiceOptions

  occupied: Set<string> = new Set()
  unoccupied: Set<string> = new Set()

  requests: Array<[Buffer, Buffer[]]> = []
  svcWorkers: Map<string, ServiceWorker> = new Map()

  constructor (socket: Router, name: string, options: IServiceOptions = {}) {
    this.name = name
    this.socket = socket
    this.options = options
  }

  addWorker(worker: Buffer) {
    const wStrId = worker.toString('hex')
    const sWorker = this.svcWorkers.get(wStrId)!

    if (sWorker) {
      // paranoia, this might happen?
      logger.warn(`Adding worker that is already exist! ${wStrId}`)

      // if this happens, do not recreate SW as it
      // resets beater and might halt running operations
    } else {
      const nWorker = new ServiceWorker(this.name, this.socket, worker, this.options)

      nWorker.on('destroy', this.removeWorker.bind(this))

      this.svcWorkers.set(wStrId, nWorker)
      this.unoccupied.add(wStrId)

      this.logInfo(`worker add: ${wStrId} (${this.occupied.size}/${this.svcWorkers.size})`)
    }

    this.consumeRequests('ADW')
  }

  removeWorker(wStrId: string) {
    const sWorker = this.svcWorkers.get(wStrId)!

    if (sWorker) {
      sWorker.clearBeater()
    }

    const deleted = this.svcWorkers.delete(wStrId)

    if (deleted) {
      this.occupied.delete(wStrId)
      this.unoccupied.delete(wStrId)
    } else {
      // TODO: handle occupied worker deletion
      // wait till worker process done? or force delete?
      console.log('--rmv')
    }

    this.logInfo(`worker rmv: ${wStrId} (${this.occupied.size}/${this.svcWorkers.size})`)

    this.consumeRequests('RMW')
  }

  dispatchClientRequest(client: Buffer, ...req: Buffer[]) {
    if (this.svcWorkers.size && this.unoccupied.size) {
      this.requests.push([client, req])
      this.consumeRequests('DCR')
    } else {
      this.logWarn(`zero worker! [${this.occupied.size}/${this.unoccupied.size}]`)
      this.socket.send([client, null, CLIENT, this.name, ERR_ZERO_WORKER, 'Zero worker!'])
    }
  }

  async consumeRequests(origin: string) {
    while (this.svcWorkers.size && this.requests.length) {
      const [key, wStrId] = this.unoccupied.entries().next().value!
      const [client, req] = this.requests.shift()!
      
      this.occupied.add(wStrId)
      this.unoccupied.delete(wStrId)
      
      const sWorker = this.svcWorkers.get(wStrId)!
      await sWorker.cascadeRequest(origin, client, ...req);
    }
  }

  async dispatchWorkerReply(worker: Buffer, client: Buffer, rep: Buffer) {
    const wStrId = worker.toString('hex')

    if (this.occupied.has(wStrId)) {
      const sWorker = this.svcWorkers.get(wStrId)!
      await sWorker.dispatchReply(client, rep)

      this.unoccupied.add(wStrId)
      this.occupied.delete(wStrId)
    }

    this.consumeRequests('DWR')
  }

  logInfo (log: string) {
    logger.info(`[${this.name}] ${log}`)
  }

  logWarn (log: string) {
    logger.warn(`[${this.name}] ${log}`)
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