const YAML = require('yamljs')
const moment = require('moment')
const { writeFileSync, readFileSync } = require('fs')

const { log } = require('./logger')
const firebase = require('../lib/firebase')

const configs = YAML.load('configs.yml')

/**
 * Default date time format that we'll save on file.
 */
const defaultDateTimeFormat = configs.service.dateFormart

/**
 * File with last execution date time.
 */
const fileName = 'last-execution.txt'

/**
 * Update file with last execution date from integration.
 */
const updateLastExecutionDate = (dateToUpdate = null) => {
  log('Updating last execution date.')

  const actualDate =
    dateToUpdate || moment().utcOffset(-3).format(defaultDateTimeFormat)

  const saveDateAsString = configs.service.persistUpdateDateAsString === 'true'
  writeFileSync(fileName, saveDateAsString ? `'${actualDate}'` : actualDate)

  // Updating last execution date on firebase.
  const { token, port, status } = configs.service
  firebase
    .database()
    .ref()
    .update({
      [`/integrators/${token}/lastExecution`]: actualDate,
      [`/integrators/${token}/connections/${port}/status`]: status,
      [`/integrators/${token}/connections/${port}/lastExecution`]: actualDate
    })

  return actualDate
}

/**
 * Load date from file.
 */
const loadLastExecutionDate = () => {
  const defaultDate = '2017-01-01 00:00:00'
  try {
    const storedDate = readFileSync(fileName, 'utf8')
    if (storedDate) {
      log(`Loaded last execution date: ${storedDate}`)
      return { date: storedDate }
    }
  } catch (err) {
    log("Using a default date as 'lastExecutionDate'")
    return { date: moment(defaultDate).format(defaultDateTimeFormat) }
  }
}

module.exports = {
  updateLastExecutionDate,
  loadLastExecutionDate
}
