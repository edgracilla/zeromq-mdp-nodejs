import { Request } from 'zeromq'

class Client {
  address: string
  socket: Request

  constructor (address: string = 'tcp://127.0.0.1:4000') {
    this.address = address

    this.socket = new Request({
      receiveTimeout: 2000
    })

    this.socket.connect(address)
  }
  
  async send () {
    await this.socket.send(["MDPC01", 'service', 'function', 'param1', 'param2', 'paramN'])
  }
    
}

export default Client
