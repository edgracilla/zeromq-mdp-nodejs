import logger from '../logger'
import Service from './service'

import { Router } from 'zeromq'
import { Header, Message } from '../types'

const { CLIENT, WORKER } = Header
const { READY, REPLY, DISCONNECT, HEARTBEAT } = Message

class Broker {
  socket: Router
  address: string

  workers: Map<string, Buffer> = new Map()
  services: Map<string, Service> = new Map()

  constructor (address: string) {
    this.address = address

    this.socket = new Router({
      sendHighWaterMark: 1,
      sendTimeout: 1
    })
  }
  
  async listen () {
    logger.info(`Listening on ${this.address}`)
    await this.socket.bind(this.address)

    for await (const [sender,, header, ...rest] of this.socket) {
      switch (header.toString()) {
        case CLIENT: this.handleClient(sender, ...rest); break
        case WORKER: this.handleWorker(sender, ...rest); break
      }
    }
  }

  handleWorker(worker: Buffer, type?: Buffer, ...rest: Buffer[]) {
    switch (type && type.toString()) {
      case READY: {
        const [service] = rest
        this.workers.set(worker.toString('hex'), service)
        this.getService(service).addWorker(worker)
        break
      }

      case REPLY: {
        const [client,, ...rep] = rest
        this.dispatchReply(worker, client, ...rep)
        break
      }

      case HEARTBEAT:
        /* Heartbeats not implemented yet. */
        break

      case DISCONNECT: {
        const service = this.getWorkerService(worker)
        this.getService(service).removeWorker(worker)
        break
      }

      default: {
        logger.warn(`Invalid worker message type: ${type}`)
      }
    }
  }

  handleClient(client: Buffer, service?: Buffer, ...req: Buffer[]) {
    const [fn] = req

    logger.info(`[${CLIENT}] ${client.toString('hex')} -> ${service?.toString()}.${fn}()`)

    if (service) {
      this.getService(service).dispatchRequest(client, service, ...req)
    }
  }

  getService(name: Buffer): Service {
    const key = name.toString()

    if (this.services.has(key)) {
      return this.services.get(key)!
    } else {
      const svc = new Service(this.socket, key)
      this.services.set(key, svc)

      return svc
    }
  }

  getWorkerService(worker: Buffer): Buffer {
    return this.workers.get(worker.toString('hex'))!
  }

  dispatchReply(worker: Buffer, client: Buffer, ...rep: Buffer[]) {
    const service = this.getWorkerService(worker)

    this.getService(service).dispatchReply(worker, client, ...rep)
  }
}

export default Broker

// zmdp-suite
// zmdp-suite
// zmdp-suite