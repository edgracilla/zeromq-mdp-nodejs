import logger from '../logger'

import { Router } from 'zeromq'
import { Header, Message } from '../types'

const { REQUEST } = Message
const { CLIENT, WORKER } = Header

class Service {
  name: string
  socket: Router

  workers: Map<string, Buffer> = new Map()
  requests: Array<[Buffer, Buffer[]]> = []

  constructor(socket: Router, name: string) {
    this.socket = socket
    this.name = name
  }

  addWorker(worker: Buffer) {
    const strWorker = worker.toString('hex')

    logger.info(`[${this.name}] addWorker: ${strWorker}`)
    this.workers.set(strWorker, worker)
    // this.consumeRequests()
  }

  removeWorker(worker: Buffer) {
    const strWorker = worker.toString('hex')

    logger.info(`[${this.name}] rmvWorker: ${strWorker}`)
    this.workers.delete(strWorker)
    // this.consumeRequests()
  }

  dispatchRequest(client: Buffer, ...req: Buffer[]) {
    this.requests.push([client, req])
    this.consumeRequests()
  }

  async dispatchReply(worker: Buffer, client: Buffer, ...rep: Buffer[]) {
    const strWorker = worker.toString('hex')
    const strClient = client.toString('hex')

    logger.info(`[${this.name}] ${strClient}.req <- ${strWorker}.rep`)

    this.workers.set(strWorker, worker)
    await this.socket.send([client, null, CLIENT, this.name, ...rep])

    // this.consumeRequests()
  }

  async consumeRequests() {
    while (this.workers.size && this.requests.length) {
      const [key, worker] = this.workers.entries().next().value!
      const [client, req] = this.requests.shift()!

      this.workers.delete(key)

      logger.info(`[${this.name}] ${client.toString('hex')}.req -> ${worker.toString('hex')}`)
      await this.socket.send([worker, null, WORKER, REQUEST, client, null, ...req])
    }
  }
}

export default Service