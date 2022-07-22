// zmdp-suite
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

  constructor (address: string = 'tcp://127.0.0.1:4000') {
    this.address = address

    this.socket = new Router({
      sendHighWaterMark: 1,
      sendTimeout: 1
    })
  }
  
  async listen () {
    console.log('Listening on:', this.address)
    await this.socket.bind(this.address)

    for await (const [sender,, header, ...rest] of this.socket) {
      console.log(`\nHEADER: ${header.toString()} FROM: ${sender.toString('hex')}`)

      switch (header.toString()) {
        case CLIENT: this.handleClient(sender, ...rest); break
        case WORKER: this.handleWorker(sender, ...rest); break
      }
      
      console.log('--d', rest.toString())
    }
  }

  handleClient(client: Buffer, service?: Buffer, ...req: Buffer[]) {
    if (service) {
      console.log({
        client: client.toString('hex'),
        service: service.toString(),
        req: req.toString(),
      })
      // this.getService(service).dispatchRequest(client, service, ...req)
    }
  }

  handleWorker(worker: Buffer, type?: Buffer, ...rest: Buffer[]) {
    switch (type && type.toString()) {
      case READY: {
        const [service] = rest
        this.registerWorker(worker, service)
        break
      }

      case REPLY: {
        const [client, blank, ...rep] = rest
        // this.dispatchReply(worker, client, ...rep)
        break
      }

      case HEARTBEAT:
        /* Heartbeats not implemented yet. */
        break

      case DISCONNECT:
        // this.deregister(worker)
        break

      default:
        console.error(`invalid worker message type: ${type}`)
    }
  }

  registerWorker(worker: Buffer, service: Buffer) {
    this.workers.set(worker.toString('hex'), service)
    this.getService(service).addWorker(worker)
  }

  getService(name: Buffer): Service {
    const key = name.toString()

    if (this.services.has(key)) {
      return this.services.get(key)!
    } else {
      const svc = new Service(this.socket, key)
      this.services.set(key, svc)

      return svc
    }
  }
}

export default Broker
