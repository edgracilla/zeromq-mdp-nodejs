import { Router } from 'zeromq'
import { Header } from '../types'

const { CLIENT } = Header
class Service {
  name: string
  socket: Router

  workers: Map<string, Buffer> = new Map()
  requests: Array<[Buffer, Buffer[]]> = []

  constructor(socket: Router, name: string) {
    this.socket = socket
    this.name = name
  }

  addWorker(worker: Buffer) {
    console.log(` addWorker: ${worker.toString('hex')} for ${this.name}`)
    this.workers.set(worker.toString('hex'), worker)
    // this.dispatchPending()
  }

  removeWorker(worker: Buffer) {
    console.log(` removeWorker: ${worker.toString('hex')} for ${this.name}`)
    this.workers.delete(worker.toString('hex'))
    // this.dispatchPending()
  }

  dispatchRequest(client: Buffer, ...req: Buffer[]) {
    this.requests.push([client, req])
    // this.dispatchPending()
  }

  async dispatchReply(worker: Buffer, client: Buffer, ...rep: Buffer[]) {
    const strWorker = worker.toString('hex') 
    const strClient = client.toString('hex') 

    console.log(` dispatchReply: ${this.name} ` +`${strClient} <- rep ${strWorker}`)

    this.workers.set(strWorker, worker)
    await this.socket.send([client, null, CLIENT, this.name, ...rep])

    // this.dispatchPending()
  }
}

export default Service