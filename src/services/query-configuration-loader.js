const YAML = require('yamljs')
const { readFileSync, accessSync, constants } = require('fs')
const { join, resolve } = require('path')
const { pipeP } = require('ramda')

/**
 * Load service configs.
 */
const loadServiceConfigs = async () => {
  const configs = YAML.load('configs.yml')
  const { sqls: sqlDirectory } = configs.directories

  return sqlDirectory
}

/**
 * Load json file configuration.
 */
const verifyIfQueryConfigurationFileExists = fileName => async sqlDirectory => {
  const filepath = join(sqlDirectory, `${fileName}`)
  try {
    const jsonFile = resolve(`${filepath}.json`)
    accessSync(jsonFile, constants.F_OK)
    return jsonFile
  } catch (err) {
    try {
      const jsFile = resolve(`${filepath}.js`)
      accessSync(jsFile, constants.F_OK)
      return jsFile
    } catch (err) {
      console.error(err)
      throw new Error('O arquivo de configuração das queries não existe.')
    }
  }
}

/**
 * Load configs from json file.
 */
const loadQueryConfigurations = async jsonFile => {
  if (jsonFile && jsonFile.endsWith('.js')) {
    return require(jsonFile)
  }
  const fileContent = readFileSync(jsonFile, 'utf8')
  if (!fileContent) {
    throw new Error('O arquivo de configuração de queries e rotas está vazio.')
  }

  return fileContent
}

/**
 * Transform content loaded from json in a JSON object.
 */
const transformToJSON = jsonString => {
  if (typeof jsonString === 'object') {
    return jsonString
  }
  return JSON.parse(jsonString)
}

/**
 * Function that controll the entire integration flow.
 */
const loadQueryConfiguration = async fileName =>
  pipeP(
    loadServiceConfigs,
    verifyIfQueryConfigurationFileExists(fileName),
    loadQueryConfigurations,
    transformToJSON
  )()

module.exports = {
  loadQueryConfiguration
}
