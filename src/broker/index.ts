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
  
  handleClient(client: Buffer, ...rest: Buffer[]) {
    const cStrId = client.toString('hex')
    const [serviceBuf, ...req] = rest

    const svcName = serviceBuf.toString()
    const service = this.services.get(svcName)!
    const fn = req[0].toString()

    if (!svcName) return logger.warn(`[${CLIENT}] ${cStrId}.req -> empty service name!`)
    if (!service) return logger.warn(`[${CLIENT}] ${cStrId}.req -> '${svcName}' no worker yet`)

    // logger.info(`[${CLIENT}] ${cStrId}.req -> ${svcName}.${fn}`)
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

    const svcExist = this.services.has(svcName)

    const service = svcExist
      ? this.services.get(svcName)!
      : new Service(this.socket, svcName)

    if (!svcExist) {
      this.services.set(svcName, service)
    }

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
        // logger.info(`HB ${wStrId}`)
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