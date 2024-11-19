const YAML = require('yamljs')
const { pipeP } = require('ramda')
const moment = require('moment')

/**
 * Loading configs.
 */
const configs = YAML.load('configs.yml')

/**
 * Colaborators services.
 */
const { log } = require('./logger')
const { chooseAdapter } = require('./adapter-chooser')
const { loadQueryConfiguration } = require('./query-configuration-loader')
const { executeQueries } = require('./query-executor')
const { awaitTime } = require('./timer')
const { restartIntegration } = require('./integration-restarter')
const {
  updateLastExecutionDate,
  loadLastExecutionDate
} = require('./last-execution-manager')

let actualDate = moment().utcOffset(-3).format(configs.service.dateFormat)

/**
 * Create an object with configured data and configured queries.
 */
const prepareToExecute = async () => {
  log('Preparing data to execute integration.')

  try {
    return {
      adapter: await chooseAdapter(),
      queries: await loadQueryConfiguration('selects'),
      dateToFilter: await loadLastExecutionDate()
    }
  } catch ({ message }) {
    console.error('Erro para preparar a execução.', message)
    throw new Error(message)
  }
}

/**
 * Execute the queries and send data to api.
 */
const runIntegration = async ({ adapter, queries, dateToFilter }) => {
  log('Running SQLs and sending data.')

  try {
    actualDate = moment().utcOffset(-3).format(configs.service.dateFormat)

    await executeQueries(adapter, queries, dateToFilter)

    const hasErrors = false
    return hasErrors
  } catch (error) {
    const hasErrors = true
    return hasErrors
  }
}

const updateLastExecutionDateIfNoError = async error => {
  if (error) {
    log('\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\')
    log('Integrador parado por falha no envio de dados')
    log('\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\')
    return true
  }

  updateLastExecutionDate(actualDate)
  return false
}

/**
 * Await for some time to restart integration.
 */
const timeToAwait = async hasError => {
  await awaitTime()
  return hasError
}

/**
 * Controll the integration flow. Add to pipe everything you want to process
 * when integration runs.
 */
const startIntegration = pipeP(
  prepareToExecute,
  runIntegration,
  updateLastExecutionDateIfNoError,
  timeToAwait,
  (hasError) => { !hasError && restartIntegration(startIntegration) }
)

module.exports = {
  startIntegration
}
