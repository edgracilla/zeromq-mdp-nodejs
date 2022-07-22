import { Dealer } from 'zeromq'
import { Header, Message } from '../types'

const { WORKER } = Header
const { READY, REPLY, DISCONNECT } = Message

// class Worker {
//   group: string
//   socket: Dealer
//   address: string

//   constructor (group: string, address: string) {
//     this.group = group
//     this.address = address

//     this.socket = new Dealer()
//     this.socket.connect(address)
//   }


// export default Worker

// import { Request } from 'zeromq'

class Worker {
  group: string
  socket: Dealer
  address: string

  constructor (group: string, address: string) {
    this.group = group
    this.address = address

    this.socket = new Dealer()
    this.socket.connect(address)
  }

  async start () {
    console.log('-- start', this.group)
    await this.socket.send([null, WORKER, READY, this.group])

    // const loop = async () => {
    //   for await (const [, header, type, client,, ...req] of this.socket) {
    //     const rep = await this.process(...req)
    //     try {
    //       await this.socket.send([
    //         null,
    //         WORKER,
    //         REPLY,
    //         client,
    //         null,
    //         ...rep,
    //       ])
    //     } catch (err) {
    //       console.error(`unable to send reply for ${this.address}`)
    //     }
    //   }
    // }

    // loop()
  }

  async stop() {
    console.log('-- stop', this.group)
    if (!this.socket.closed) {
      await this.socket.send([null, WORKER, DISCONNECT, this.group])
      this.socket.close()
    }
  }

  async process(...req: Buffer[]): Promise<Buffer[]> {
    return req
  }
    
}

export default Worker
