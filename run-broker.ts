import { Broker } from './index'

const broker = new Broker('tcp://127.0.0.1:4000');

broker.foo()