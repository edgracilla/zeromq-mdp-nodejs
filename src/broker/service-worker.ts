import EventEmitter from 'events'

interface IServiceOptions {
  heartbeatLiveness?: number
  heartbeatInterval?: number
}

class ServiceWorker extends EventEmitter{
  wId: Buffer
  liveness: number
  heartbeatLiveness: number
  beater: ReturnType<typeof setInterval>

  constructor (wId: Buffer, options: IServiceOptions) {
    super()

    this.wId = wId
    this.liveness = this.heartbeatLiveness = options.heartbeatLiveness || 3
    
    const interval = options.heartbeatInterval || 3000
    this.beater = setInterval(this.heartbeat.bind(this), interval)
  }

  heartbeat () {
    if (this.liveness > 0) {
      console.log('-- ls', this.liveness)
      this.liveness--
      // await this.socket.send([null, WORKER, HEARTBEAT])
    } else {
      this.emit('destroy', this.wId.toString('hex'))
    }
  }

  resetLiveness () {
    this.liveness = this.heartbeatLiveness
  }

  clearBeater () {
    clearInterval(this.beater)
  }
}

export default ServiceWorker
