const YAML = require('yamljs')

/**
 * Await for the configured time on service settings.
 */
const awaitTime = async () => {
  const configs = YAML.load('configs.yml')
  const { interval } = configs.service

  if (!interval) {
    throw new Error(
      'Você precisa configurar o intervalo entre uma integração e outra.'
    )
  }

  return new Promise(resolve => setTimeout(resolve, interval))
}

module.exports = {
  awaitTime
}
