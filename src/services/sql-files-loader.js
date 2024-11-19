const { extname } = require('path')
const { readdirSync } = require('fs')
const { pipeP } = require('ramda')

/**
 * Filter files by extensios.
 */
const getOnlySQLFiles = file => extname(file) === '.sql'

/**
 * Read some directory to grab sql files.
 *
 * @param string path
 */
const readSQLFilesFromPath = async path => {
  if (!path) {
    throw new Error('Você precisa informar o diretório onde estão os SQLs.')
  }

  const files = await readdirSync(path)
  const sqlFiles = await files.filter(getOnlySQLFiles)

  if (!files.length || !sqlFiles.length) {
    throw new Error('Nenhum arquivo SQL encontrado no diretório informado.')
  }

  return sqlFiles
}

/**
 * Sort sql files based on starting numbers.
 */
const reorderFilesByNumber = files => files.sort()

/**
 * Start the process to execute all queries from sql files
 * and send to API.
 */
const loadSqlFiles = pipeP(
  readSQLFilesFromPath,
  reorderFilesByNumber
)

module.exports = {
  loadSqlFiles
}
