const moment = require('moment')

const { noop } = require('../lib/functions')

/**
 * Service to log what you want based on environment.
 */
const log = content => {
  const environment = process.env.NODE_ENV

  const dateToLog = moment().utcOffset(-3).format('YYYY-MM-DD hh:mm:ss')

  // What to do per environment.
  const logs = {
    test: noop,
    dev: content => console.log(dateToLog, '::', content),
    production: content => console.log(dateToLog, '::', content)
  }

  logs[environment](content)
}

module.exports = {
  log
}
