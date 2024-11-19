const YAML = require('yamljs')

/**
 * Adapters list.
 */
const {
  firebird,
  firebirdV3,
  informix,
  oracle,
  oracle12,
  postgres,
  cache,
  sqlserver,
  mysql,
  rest
} = require('../adapters')

/**
 * A simple strategy pattern to load the correct database
 * adapter on the fly.
 */
const chooseAdapter = async () => {
  const configs = YAML.load('configs.yml')
  const { dialect: ConfiguredDialect } = configs.database

  if (!ConfiguredDialect) {
    throw new Error('Você precisa definir qual o dialeto do banco.')
  }

  // Register all your adapters.
  const dialects = {
    firebirdV3,
    firebird,
    informix,
    postgres,
    oracle,
    oracle12,
    cache,
    sqlserver,
    mysql,
    rest
  }

  // No recognized dialect.
  const noDialect = () => {
    throw new Error('O dialeto definido nas configurações não é suportado.')
  }

  return dialects[ConfiguredDialect] || noDialect()
}

module.exports = {
  chooseAdapter
}
