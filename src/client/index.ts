import logger from '../logger'

import { Request } from 'zeromq'
import { Header } from '../types'

const { CLIENT } = Header

interface ClientOption {
  address: string,
  timeout?: number
}

class Client {
  address: string
  timeout: number
  socket: Request

  constructor (option: ClientOption) {
    const { address, timeout } = option

    this.address = address
    this.timeout = timeout || 5000

    this.socket = new Request({ receiveTimeout: this.timeout })
    this.socket.connect(address)
  }
  
  async send (service: string, fn: string, ...params: string[]) {
    await this.socket.send([CLIENT, service, fn, ...params])

    try {
      const [, header, ...res] = await this.socket.receive()
      console.log(`received '${res.join(", ")}' from '${service}'`)
      return res
    } catch (err) {
      logger.warn(`Timeout: calling service '${service}' (${this.timeout / 1000}s)`)
    }
  }
    
}

export default Client
