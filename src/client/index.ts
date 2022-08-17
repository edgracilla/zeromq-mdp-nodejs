import { Request, Context } from 'zeromq'
import { Header } from '../types'

const { CLIENT } = Header

interface ClientOption {
  address: string,
  timeout?: number
  retry?: number
  logger?: any
}

export class Client {
  logger: any

  socket: Request
  address: string
  timeout: number
  retry: number

  request: Array<[string, string, string[]]> = []

  constructor (options: ClientOption) {
    const { address, timeout, retry, logger } = options

    const context = new Context({
      blocky: false
    })

    this.address = address

    this.retry = retry || 3
    this.logger = logger || console
    this.timeout = timeout || 1000 * 10
    
    this.socket = new Request({
      receiveTimeout: this.timeout,
      linger: 1,
      context
    })

    this.socket.connect(address)
  }

  async sendRcv (service: string, module: string, fn: string, params: Buffer) {
    await this.socket.send([CLIENT, service, module, fn, params])

    try {
      const [header, service, resp] = await this.socket.receive()
      console.log('--rcvd resp', resp.toString())
      return resp.toString()
    } catch (err) {
      this.logger.error(err)
    }
  }

  async sendRcv2 (service: string, fn: string, ...params: string[]) {
    let tries = 0

    await this.socket.send([CLIENT, service, fn, ...params])

    while (tries < this.retry) {
      try {
        const [header, service, status, resp] = await this.socket.receive()
        console.log('--a', header.toString(), service.toString(), status.toString(), resp.toString())
        return resp.toString()
      } catch (err) {
        console.log(err)
        this.logger.warn(`Timeout: calling service '${service}' x${tries+1} (${this.timeout / 1000}s)`)
      }

      tries++
    }
    
    this.logger.error(`Client REQ failed: ${this.retry} retries consumed`)
  }
    
}
