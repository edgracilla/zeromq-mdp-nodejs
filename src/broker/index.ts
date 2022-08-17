import Service from './service'
import { Router } from 'zeromq'
import { Header, Message, IOptions } from '../types'

const { CLIENT, WORKER } = Header
const { READY, REPLY, DISCONNECT, HEARTBEAT } = Message

const routerConfig = {
  sendHighWaterMark: 1,
  sendTimeout: 1
}

export class Broker {
  logger: any
  socket: Router
  address: string
  svcConf: IOptions

  services: Map<string, Service> = new Map()
  svcWorkerIndex: Map<string, string> = new Map()

  constructor (address: string, options: IOptions) {
    this.address = address
    this.svcConf = options
    this.socket = new Router(routerConfig)
    this.logger = options.logger || console
  }
  
  async listen () {
    this.logger.info(`Listening on ${this.address}`)
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
      return this.logger.error(`[${CLIENT}] ${cStrId}.req -> empty service name!`)
    }

    if (!this.services.has(svcName)) {
      this.services.set(svcName, new Service(this.socket, svcName, this.svcConf))
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
      this.services.set(svcName, new Service(this.socket, svcName, this.svcConf))
    }

    const service = this.services.get(svcName)!

    if (!svcName) return this.logger.warn(`Worker ${wStrId} not in worker/service index.`)
    if (!service) return this.logger.warn(`Service '${svcName}' not found.`)

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
        this.logger.warn(`Invalid worker message type: ${type}`)
      }
    }
  }

  anchorExits () {
    const sigFn: { [key: string ] : any } = {}
    const SIGNALS = ['SIGHUP', 'SIGINT', 'SIGTERM'] as const

    SIGNALS.map(signal => {
      sigFn[signal] = async () => {
        await this.socket.close()
        process.removeListener(signal, sigFn[signal])
      }

      process.on(signal, sigFn[signal])
    })
  }
}

// zmdp-ms-suite
// zmdp-ms-suite
// zmdp-suite
// zmdp-suite