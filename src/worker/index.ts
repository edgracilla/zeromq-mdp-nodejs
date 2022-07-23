import logger from '../logger'

import { Dealer } from 'zeromq'
import { Header, Message } from '../types'

const { WORKER } = Header
const { READY, REPLY, DISCONNECT } = Message

class Worker {
  group: string
  socket: Dealer
  address: string

  actions: Map<string, Function> = new Map()

  constructor (group: string, address: string) {
    this.group = group
    this.address = address

    this.socket = new Dealer()
    this.socket.connect(address)
  }

  async start () {
    if (!this.actions.size) {
      throw new Error('Atleast one (1) worker action is required.')
    }

    logger.info(`Started worker for service '${this.group}'`)
    await this.socket.send([null, WORKER, READY, this.group])

    const loop = async () => {
      for await (const [, header, type, client,, ...req] of this.socket) {
        const rep = await this.process(client, ...req)

        try {
          await this.socket.send([null, WORKER, REPLY, client, null, rep])
        } catch (err) {
          console.log(err)
          console.error(`unable to send reply for ${this.address}`)
        }
      }
    }

    loop()
  }

  async stop() {
    logger.info(`Worker stopped for service '${this.group}'`)
    if (!this.socket.closed) {
      await this.socket.send([null, WORKER, DISCONNECT, this.group])
      this.socket.close()
    }
  }

  injectAction (action: Function) {
    this.actions.set(action.name, action)
  }

  async process(client: Buffer, ...req: Buffer[]) {
    const [svc, fn, ...parans] = req

    const strFn = fn.toString()
    const strClient = client.toString('hex')
    const action = this.actions.get(strFn)!

    if (!action) {
      logger.warn(`${svc}.${fn}() not found.`)
    } else {
      logger.info(`Processing ${svc}.${fn}() -> ${strClient}`)
      return await action(...parans)
    }
  }
}

export default Worker
