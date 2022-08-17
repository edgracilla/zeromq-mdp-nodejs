import logger from '../logger'

import { Dealer } from 'zeromq'
import { Header, Message } from '../types'

const { WORKER } = Header
const { READY, REPLY, DISCONNECT, HEARTBEAT, REQUEST } = Message

interface IWorkerOption {
  service: string
  address: string
  protoSrc?: string
  heartbeatInterval?: number
  heartbeatLiveness?: number
}

export class Worker {
  socket: Dealer
  address: string
  svcName: string
  protoSrc: string

  beater: any
  liveness: number
  heartbeatLiveness: number
  heartbeatInterval: number

  _paramDecoder: Function = async () => {}
  _resultEncoder: Function = async () => {}

  actions: Map<string, Function> = new Map()

  constructor (config: IWorkerOption) {
    this.address = config.address
    this.svcName = config.service
    this.protoSrc = config.protoSrc || '.'

    this.heartbeatInterval = config.heartbeatInterval || 3000
    this.liveness = this.heartbeatLiveness = config.heartbeatLiveness || 3
    
    this.socket = new Dealer()
    this.anchorExits()
  }

  async start (recon = false) {
    if (!this.actions.size) {
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

    console.log('--worker resp', rep)

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

  exposeFn (module: string, action: Function) {
    console.log(`${module}.${action.name.replace(/bound /i, '')}`, action)
    this.actions.set(`${module}.${action.name.replace(/bound /i, '')}`, action)
  }

  async process(client: Buffer, ...req: Buffer[]) {
    const [module, fn, ...params] = req

    const strFn = fn.toString()
    const strModule = module.toString()

    const strClient = client.toString('hex')
    const action = this.actions.get(`${strModule}.${strFn}`)!

    if (!action) {
      logger.warn(`${this.svcName}.${fn}() not found.`)
    } else {
      logger.info(`[${strClient}] ${this.svcName}.${module}.${fn}()`)

      try {
        const paramData = await this._paramDecoder(module, strFn, params) || params
        const result = await action(...paramData)
        const encodedResult = await this._resultEncoder(module, strFn, result) || result

        return encodedResult
      } catch (err) {
        console.log('-- [w] err', err)
        // TODO: reply error. how? on mdp
      }
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

  // -- expiremental

  setParamDecoder (fn: Function) {
    this._paramDecoder = fn
  }

  setResultEncoder (fn: Function) {
    this._resultEncoder = fn
  }
}
