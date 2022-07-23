import { Request } from 'zeromq'
import { Header } from '../types'

const { CLIENT } = Header

class Client {
  address: string
  socket: Request

  constructor (address: string) {
    this.address = address
    this.socket = new Request({ receiveTimeout: 3000 })
    this.socket.connect(address)
  }
  
  async send (service: string, fn: string, ...params: string[]) {
    await this.socket.send([CLIENT, service, fn, ...params])

    try {
      const [blank, header, ...res] = await this.socket.receive()
      console.log(`received '${res.join(", ")}' from '${service}'`)
      return res
    } catch (err) {
      console.log(`Timeout: ${service}`)
    }
  }
    
}

export default Client
