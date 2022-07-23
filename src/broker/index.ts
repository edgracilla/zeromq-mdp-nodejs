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
        const strWorker = worker.toString('hex')

        this.workers.set(strWorker, service)
        this.getService(service).addWorker(worker)
        break
      }

      case REPLY: {
        const [client,, rep] = rest
        const service = this.getWorkerService(worker)

        if (service) this.getService(service).dispatchReply(worker, client, rep)
        break
      }

      case HEARTBEAT:
        /* Heartbeats not implemented yet. */
        logger.info(rest.toString())
        break

      case DISCONNECT: {
        const service = this.getWorkerService(worker)
        if (service) this.getService(service).removeWorker(worker)
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
      const service = new Service(this.socket, key)
      this.services.set(key, service)

      return service
    }
  }

  getWorkerService(worker: Buffer): Buffer {
    return this.workers.get(worker.toString('hex'))!
  }
}

export default Broker

// zmdp-ms-suite
// zmdp-ms-suite
// zmdp-ms-suite