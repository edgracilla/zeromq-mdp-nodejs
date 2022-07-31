import { Broker } from './index'

const svcConf = {
  verbose: 1,
  heartbeatLiveness: 3,
  heartbeatInterval: 3000,
  workerRequestTimeout: 5000,
}

const broker = new Broker('tcp://127.0.0.1:4000', svcConf);

broker.listen()
