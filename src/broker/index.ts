import logger from '../logger'
import Service from './service'

import { Router } from 'zeromq'
import { Header, Message } from '../types'

const { CLIENT, WORKER } = Header
const { READY, REPLY, DISCONNECT, HEARTBEAT } = Message

class Broker {
  socket: Router
  address: string

  services: Map<string, Service> = new Map()
  svcWorkerIndex: Map<string, string> = new Map()

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

    for await (const [sender, blank, header, ...rest] of this.socket) {
      switch (header.toString()) {
        case CLIENT: this.handleClient(sender, ...rest); break
        case WORKER: this.handleWorker(sender, ...rest); break
      }
    }
  }

  handleWorker(worker: Buffer, type?: Buffer, ...rest: Buffer[]) {
    const wStrId = worker.toString('hex')
    const msgType = type && type.toString()
    const mightWorkerExist = msgType !== READY

    const svcName = mightWorkerExist
      ? this.svcWorkerIndex.get(wStrId)!
      : rest[0].toString()

    const service = this.getService(svcName)

    if (!svcName) return logger.warn(`Worker ${wStrId} not in worker/service index.`)
    if (!service) return logger.warn(`Service '${svcName}' not found.`)

    switch (msgType) {
      case READY: {
        service.addWorker(worker)
        this.svcWorkerIndex.set(wStrId, svcName)
        break
      }

      case REPLY: {
        const [client,, rep] = rest
        service.dispatchReply(worker, client, rep)
        break
      }

      case HEARTBEAT:
        logger.info(`HB ${wStrId}`)
        service.resetLiveness(worker)
        break

      case DISCONNECT: {
        service.removeWorker(worker)
        break
      }

      default: {
        logger.warn(`Invalid worker message type: ${type}`)
      }
    }
  }

  handleClient(client: Buffer, serviceBuf?: Buffer, ...req: Buffer[]) {
    const svcName = serviceBuf?.toString()
    const cStrId = client.toString('hex')
    const fn = req[0].toString()

    if (!svcName) {
      return logger.warn(`[${CLIENT}] ${cStrId}.req -> empty service`)
    }
  
    logger.info(`[${CLIENT}] ${cStrId}.req -> ${svcName}.${fn}`)
    const service = this.getService(svcName)

    if (!service) {
      return logger.warn(`[${CLIENT}] ${cStrId}.req -> service not found!`)
    }

    service.dispatchRequest(client, ...req)
  }

  getService(name: string): Service {
    if (this.services.has(name)) {
      return this.services.get(name)!
    } else {
      const service = new Service(this.socket, name)
      this.services.set(name, service)

      return service
    }
  }
}

export default Broker

// zmdp-ms-suite
// zmdp-ms-suite
// zmdp-ms-suite