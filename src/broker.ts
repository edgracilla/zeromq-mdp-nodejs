import { Router } from 'zeromq'

class Broker {
  address: string
  socket: Router

  constructor (address: string = 'tcp://127.0.0.1:4000') {
    this.address = address

    this.socket = new Router({
      sendHighWaterMark: 1,
      sendTimeout: 1
    })
  }
  
  async listen () {
    console.log('Hi im foo!')
    // await this.socket.bind(this.address)

    // for await (const [sender, blank, header, rest] of this.socket) {
    //   console.log('--a', sender, blank, header, rest)
    // }
  }
}

export default Broker
