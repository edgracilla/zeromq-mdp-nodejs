import { Router } from 'zeromq'

class Service {
  name: string
  socket: Router

  workers: Map<string, Buffer> = new Map()
  requests: Array<[Buffer, Buffer[]]> = []

  constructor(socket: Router, name: string) {
    this.socket = socket
    this.name = name
  }

  dispatchRequest(client: Buffer, ...req: Buffer[]) {
    this.requests.push([client, req])
    // this.dispatchPending()
  }

  addWorker(worker: Buffer) {
    console.log(`registered worker ${worker.toString('hex')} for '${this.name}'`)
    this.workers.set(worker.toString('hex'), worker)
    // this.dispatchPending()
  }
}

export default Service