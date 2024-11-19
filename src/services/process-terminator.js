const axios = require('axios')

/**
 * Loading configs from yaml file.
 */
const YAML = require('yamljs')
const configs = YAML.load('configs.yml')

function sendUncaughtException (message, stack) {
  const isProduction = process.env.NODE_ENV === 'production'
  if (!isProduction) return

  const { name } = configs.service

  axios.post('https://discordapp.com/api/webhooks/761224988996141068/fhrZou466yP8Kh4WrELJkRMgYC73pnr57Yz7na1Mvwu51hNDflurjp-Z_zPCJx2STrmT', {
    content: `Capturado um erro não mapeado no daemon da ${name}`,
    embeds: [
      {
        title: 'Daemon',
        description: `O erro ocorrido foi ${message} - [STACK: ${stack}]`,
        color: 16426522
      }
    ]
  })
}

function terminate (server, options = { coredump: false, timeout: 500 }) {
  // Exit function
  const exit = code => {
    options.coredump ? process.abort() : process.exit(code)
  }

  return (code, reason) => (err, promise) => {
    if (err && err instanceof Error) {
      // Log error information, use a proper logging library here :)
      sendUncaughtException(err.message, err.stack)
    }

    // Attempt a graceful shutdown
    server.close(exit)
    setTimeout(exit, options.timeout).unref()
  }
}

module.exports = { terminate }
