import logger from '../logger'

import { Router } from 'zeromq'
import { Header, Message } from '../types'
import Service, { IServiceOptions } from './service'

const { CLIENT, WORKER } = Header
const { READY, REPLY, DISCONNECT, HEARTBEAT } = Message

const routerConfig = {
  sendHighWaterMark: 1,
  sendTimeout: 1
}

const svcConf: IServiceOptions = {
  heartbeatLiveness: 3,
  heartbeatInterval: 3000,
  workerRequestTimeout: 5000
}

class Broker {
  socket: Router
  address: string

  services: Map<string, Service> = new Map()
  svcWorkerIndex: Map<string, string> = new Map()

  constructor (address: string) {
    this.address = address
    this.socket = new Router(routerConfig)
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
  
  handleClient(client: Buffer, ...rest: Buffer[]) {
    const cStrId = client.toString('hex')
    const [serviceBuf, ...req] = rest

    const svcName = serviceBuf.toString()
    
    if (!svcName) {
      return logger.error(`[${CLIENT}] ${cStrId}.req -> empty service name!`)
    }

    if (!this.services.has(svcName)) {
      this.services.set(svcName, new Service(this.socket, svcName, svcConf))
    }

    const service = this.services.get(svcName)!
    service.dispatchClientRequest(client, ...req)
  }

  handleWorker(worker: Buffer, ...rest: Buffer[]) {
    const [type, ...req] = rest

    const msgType = type.toString()
    const wStrId = worker.toString('hex')
    const mightSvcExist = msgType !== READY

    const svcName = mightSvcExist
      ? this.svcWorkerIndex.get(wStrId)!
      : req[0].toString()

    if (!this.services.has(svcName)) {
      this.services.set(svcName, new Service(this.socket, svcName, svcConf))
    }

    const service = this.services.get(svcName)!

    if (!svcName) return logger.warn(`Worker ${wStrId} not in worker/service index.`)
    if (!service) return logger.warn(`Service '${svcName}' not found.`)

    switch (msgType) {
      case READY: {
        service.addWorker(worker)
        this.svcWorkerIndex.set(wStrId, svcName)
        break
      }

      case REPLY: {
        const [client, blank, rep] = req
        service.dispatchWorkerReply(worker, client, rep)
        break
      }

      case HEARTBEAT:
        service.resetWorkerLiveness(wStrId)
        break

      case DISCONNECT: {
        service.removeWorker(wStrId)
        break
      }

      default: {
        logger.warn(`Invalid worker message type: ${type}`)
      }
    }
  }
}

export default Broker

// zmdp-ms-suite
// zmdp-ms-suite
// zmdp-ms-suite