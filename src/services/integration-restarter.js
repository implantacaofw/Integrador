const { noop } = require('../lib/functions')
const { log } = require('./logger')

/**
 * Restart integration whether in production mode.
 */
const restartIntegration = async fn => {
  const environment = process.env.NODE_ENV

  const environmentConfiguration = {
    test: noop,
    dev: noop,
    production: fn
  }

  log('Restarting integration process.')
  environmentConfiguration[environment]()
}

module.exports = {
  restartIntegration
}
