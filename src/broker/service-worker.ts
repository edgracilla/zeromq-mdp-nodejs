import logger from '../logger'
import { Router } from 'zeromq'
import EventEmitter from 'events'
import { Header, Message, WorkerResponse } from '../types'

const { WORKER, CLIENT } = Header
const { HEARTBEAT, REQUEST } = Message
const { RESP_OK, ERR_ZERO_WORKER } = WorkerResponse

interface IServiceOptions {
  heartbeatLiveness?: number
  heartbeatInterval?: number
}

class ServiceWorker extends EventEmitter {
  wId: Buffer
  wStrId: string
  socket: Router
  svcName: string

  liveness: number
  heartbeatLiveness: number
  beater: ReturnType<typeof setInterval>
  request: Array<[Buffer, Buffer[]]> = []

  constructor (svcName: string, socket: Router, wId: Buffer, options: IServiceOptions) {
    super()

    this.wId = wId
    this.socket = socket
    this.svcName = svcName
    this.wStrId = wId.toString('hex')

    this.liveness = this.heartbeatLiveness = options.heartbeatLiveness || 3
    
    const interval = options.heartbeatInterval || 3000
    this.beater = setInterval(this.heartbeat.bind(this), interval)
  }

  async cascadeRequest (origin: string, client: Buffer, ...req: Buffer[]) {
    const cStrId = client.toString('hex')
    const [fn] = req

    this.request.push([client, req])

    logger.info(`[${this.svcName}] cascades: ${cStrId}.req -> ${this.wStrId}.${fn} (${origin})`)
    await this.socket.send([this.wId, null, WORKER, REQUEST, client, null, ...req])
  }

  async dispatchReply (client: Buffer, rep: Buffer) {
    const cStrId = client.toString('hex')

    logger.info(`[${this.svcName}] dispatch: ${cStrId}.req <- ${this.wStrId}.rep`)
    await this.socket.send([client, null, CLIENT, this.svcName, RESP_OK, rep])

    this.request.shift()
  }

  async heartbeat () {
    if (this.liveness > 0) {
      this.liveness--

      if (!this.socket.closed) {
        await this.socket.send([this.wId, null, WORKER, HEARTBEAT])
      }
    } else {
      this.emit('destroy', this.wId.toString('hex'))
    }
  }

  resetLiveness () {
    this.liveness = this.heartbeatLiveness
  }

  clearBeater () {
    clearInterval(this.beater)
  }
}

export default ServiceWorker
