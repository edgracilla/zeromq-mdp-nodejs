import logger from '../logger'

import { Dealer } from 'zeromq'
import { Header, Message } from '../types'

const { WORKER } = Header
const { READY, REPLY, DISCONNECT, HEARTBEAT, REQUEST } = Message

interface IWorkerOption {
  heartbeatInterval?: number
  heartbeatLiveness?: number
}

class Worker {
  group: string
  socket: Dealer
  address: string

  beater: any
  liveness: number
  heartbeatLiveness: number
  heartbeatInterval: number

  actions: Map<string, Function> = new Map()

  constructor (group: string, address: string, opts: IWorkerOption = {}) {
    this.group = group
    this.address = address

    this.heartbeatInterval = opts.heartbeatInterval || 3000
    this.liveness = this.heartbeatLiveness = opts.heartbeatLiveness || 3
    
    this.socket = new Dealer()
  }

  async start () {
    if (!this.actions.size) {
      throw new Error('Atleast one (1) worker action is required.')
    }

    this.socket = new Dealer({ linger: 1})
    this.liveness = this.heartbeatLiveness

    await this.socket.connect(this.address)
    await this.socket.send([null, WORKER, READY, this.group])

    this.beater = setInterval(this.heartbeat.bind(this), this.heartbeatInterval)

    logger.info(`[${this.group}] worker started. ls(${this.heartbeatLiveness})`)

    for await (const [, header, type, client,, ...req] of this.socket) {
      console.log('--wh', header.toString())

      this.liveness = this.heartbeatLiveness
      const rep = await this.process(client, ...req)

      try {
        await this.socket.send([null, WORKER, REPLY, client, null, rep])
      } catch (err) {
        console.log(err)
        console.error(`unable to send reply for ${this.address}`)
      }
    }
  }

  async heartbeat () {
    if (this.liveness > 0) {
      console.log('-- ls', this.liveness)
      this.liveness--
      await this.socket.send([null, WORKER, HEARTBEAT])
    } else {
      console.log('-- Reconnecting', this.liveness)
      if (this.beater) {
        clearInterval(this.beater)
      }

      this.socket.close()

      await this.start()
    }
  }

  async stop() {
    logger.info(`[${this.group}] worker closed.`)

    if (this.beater) {
      clearInterval(this.beater)
    }

    if (!this.socket.closed) {
      await this.socket.send([null, WORKER, DISCONNECT, this.group])
      this.socket.close()
    }
  }

  injectAction (action: Function) {
    this.actions.set(action.name, action)
  }

  async process(client: Buffer, ...req: Buffer[]) {
    const [fn, ...parans] = req

    const strFn = fn.toString()
    const strClient = client.toString('hex')
    const action = this.actions.get(strFn)!

    if (!action) {
      logger.warn(`${this.group}.${fn}() not found.`)
    } else {
      logger.info(`Processing ${this.group}.${fn}() -> ${strClient}`)
      return await action(...parans)
    }
  }
}

export default Worker
