import logger from '../logger'
const protobuf = require('protobufjs')

import { Dealer } from 'zeromq'
import { Header, Message } from '../types'

const { WORKER } = Header
const { READY, REPLY, DISCONNECT, HEARTBEAT, REQUEST } = Message

interface IWorkerOption {
  heartbeatInterval?: number
  heartbeatLiveness?: number
}

export class Worker {
  socket: Dealer
  address: string
  svcName: string

  beater: any
  liveness: number
  heartbeatLiveness: number
  heartbeatInterval: number

  functions: Map<string, [Function, string[]]> = new Map()

  constructor (svcName: string, address: string, opts: IWorkerOption = {}) {
    this.address = address
    this.svcName = svcName

    this.heartbeatInterval = opts.heartbeatInterval || 3000
    this.liveness = this.heartbeatLiveness = opts.heartbeatLiveness || 3
    
    this.socket = new Dealer()
    this.anchorExits()
  }

  async start (recon = false) {
    if (!this.functions.size) {
      throw new Error('Atleast one (1) worker action is required.')
    }

    this.socket = new Dealer({ linger: 1})
    this.liveness = this.heartbeatLiveness

    await this.socket.connect(this.address)
    await this.socket.send([null, WORKER, READY, this.svcName])

    this.beater = setInterval(this.heartbeat.bind(this), this.heartbeatInterval)

    logger.info(`${recon ? 'Reconnect: ' : ''}[${this.svcName}] ZMDP Worker started.`)

    for await (const [blank, header, type, client, blank2, ...req] of this.socket) {
      this.liveness = this.heartbeatLiveness
      
      switch (type.toString()) {
        case REQUEST:
          this.handleClientRequest(client, ...req)
          break;

        case HEARTBEAT:
          break;

        // case DISCONNECT:
          // TODO: handle disconnect
          // break;
      }
    }
  }

  async handleClientRequest (client: Buffer, ...req: Buffer[]) {
    const rep = await this.process(client, ...req)

    try {
      await this.socket.send([null, WORKER, REPLY, client, null, rep])
    } catch (err) {
      console.log(err)
      console.error(`unable to send reply for ${this.address}`)
    }
  }

  async heartbeat () {
    if (this.liveness > 0) {
      this.liveness--
      await this.socket.send([null, WORKER, HEARTBEAT])
    } else {
      if (this.beater) {
        clearInterval(this.beater)
      }

      this.socket.close()
      await this.start(true)
    }
  }

  async stop() {
    logger.info(`[${this.svcName}] worker closed.`)

    if (this.beater) {
      clearInterval(this.beater)
    }

    if (!this.socket.closed) {
      await this.socket.send([null, WORKER, DISCONNECT])
      this.socket.close()
    }
  }

  exposeFn (module: string, action: Function, types: string[]) {
    this.functions.set(`${module}.${action.name}`, [action, types])
  }

  async process(client: Buffer, ...req: Buffer[]) {
    const [module, fn, ...params] = req

    const strFn = fn.toString()
    const strModule = module.toString()

    const strClient = client.toString('hex')
    const [action, types] = this.functions.get(`${strModule}.${strFn}`)!

    if (!action) {
      logger.warn(`${this.svcName}.${fn}() not found.`)
    } else {
      logger.info(`[${strClient}] ${this.svcName}.${module}.${fn}(${params.length})`)

      // -- POC only
      const root = await protobuf.load('test.proto')
      const Proto = root.lookupType(`samplepkg.${strFn}`)
      const msg = Proto.decode(params[0])
      const msgObj = Proto.toObject(msg)

      const map = Object.keys(msgObj).map(key => msgObj[key])

      console.log('--x', msgObj)
      console.log('--z', map)
      // --

      return await action(...map)
    }
  }

  anchorExits () {
    const sigFn: { [key: string ] : any } = {}
    const SIGNALS = ['SIGHUP', 'SIGINT', 'SIGTERM'] as const

    SIGNALS.map(signal => {
      sigFn[signal] = async () => {
        await this.stop()
        process.removeListener(signal, sigFn[signal])
      }

      process.on(signal, sigFn[signal])
    })
  }
}
