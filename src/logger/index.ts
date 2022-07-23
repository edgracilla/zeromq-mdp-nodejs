import pino from 'pino'

const conf = {
  transport: {
    target: 'pino-pretty',
    options: { translateTime: true }
  }
}

// TODO: disable pretty in prod

const logger = require('pino')(conf)

export default logger
