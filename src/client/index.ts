import logger from '../logger'

import { Request } from 'zeromq'
import { Header } from '../types'

const { CLIENT } = Header

interface ClientOption {
  address: string,
  timeout?: number
  retry?: number
}

class Client {
  socket: Request
  address: string
  timeout: number
  retry: number

  constructor (option: ClientOption) {
    const { address, timeout, retry } = option

    this.retry = retry || 3
    this.timeout = timeout || 5000
    this.address = address

    this.socket = new Request({
      receiveTimeout: this.timeout,
    })

    this.socket.connect(address)
  }
  
  async sendRcv (service: string, fn: string, ...params: string[]) {
    let tries = 0

    await this.socket.send([CLIENT, service, fn, ...params])

    while (tries < this.retry) {
      try {
        const [,, resp] = await this.socket.receive()
        return resp.toString()
      } catch (err) {
        logger.warn(`Timeout: calling service '${service}' x${tries+1} (${this.timeout / 1000}s)`)
      }

      tries++
    }
    
    logger.error(`REQ failed: ${this.retry} retries consumed`)
  }
    
}

export default Client
