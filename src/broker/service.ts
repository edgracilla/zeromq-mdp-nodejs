import logger from '../logger'

import { Router } from 'zeromq'
import { Header, Message } from '../types'

const { REQUEST } = Message
const { CLIENT, WORKER } = Header

interface IWorkerStruct {
  id: Buffer
  liveness: number
}

interface IServiceOptions {
  heartbeatLiveness?: number
  heartbeatInterval?: number
}

class Service {
  name: string
  socket: Router

  interval: number
  liveness: number

  workers: Map<string, IWorkerStruct> = new Map()
  requests: Array<[Buffer, Buffer[]]> = []

  constructor(socket: Router, name: string, opts: IServiceOptions = {}) {
    this.name = name
    this.socket = socket

    this.liveness = opts.heartbeatLiveness || 3
    this.interval = opts.heartbeatInterval || 3000
  }

  addWorker(worker: Buffer) {
    const wStrId = worker.toString('hex')

    const wStruct: IWorkerStruct = {
      liveness: 3,
      id: worker,
    }

    this.logInfo(`addWorker: ${wStrId} (${this.workers.size + 1})`)
    this.workers.set(wStrId, wStruct)

    this.consumeRequests()
  }

  removeWorker(worker: Buffer) {
    const wStrId = worker.toString('hex')

    this.logInfo(`rmvWorker: ${wStrId}`)
    this.workers.delete(wStrId)
    this.consumeRequests()
  }

  dispatchRequest(client: Buffer, ...req: Buffer[]) {
    this.requests.push([client, req])
    this.consumeRequests()
  }

  async dispatchReply(worker: Buffer, client: Buffer, rep: Buffer) {
    const wStrId = worker.toString('hex')
    const cStrId = client.toString('hex')

    const wStruct: IWorkerStruct = {
      liveness: 3,
      id: worker,
    }

    this.logInfo(`dispatch: ${cStrId}.req <- ${wStrId}.rep`)

    this.workers.set(wStrId, wStruct)
    await this.socket.send([client, null, CLIENT, this.name, rep])

    this.consumeRequests()
  }

  async consumeRequests() {
    while (this.workers.size && this.requests.length) {
      const [key, wStruct] = this.workers.entries().next().value!
      const [client, req] = this.requests.shift()!
      
      this.workers.delete(key)
      
      const [fn] = req
      const wStrId = wStruct.id.toString('hex')
      const cStrId = client.toString('hex')

      this.logInfo(`consumes: ${cStrId}.req -> ${wStrId}.${fn}`)
      await this.socket.send([wStruct.id, null, WORKER, REQUEST, client, null, ...req])
    }
  }

  logInfo (log: string) {
    logger.info(`[${this.name}] ${log}`)
  }

  resetLiveness (worker: Buffer) {

  }
}

export default Service