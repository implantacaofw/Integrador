const YAML = require('yamljs')
const axios = require('axios')
const alasql = require('alasql')
const { readFileSync } = require('fs')

const { log } = require('../services/logger')

const adapter = (function (yaml, log) {
  /**
   * (SINGLETON) Store database connection.
   */
  const _databaseConnection = null
  let _api = null

  /**
   * Load all database data to connection.
   */
  function _getDatabaseAuthData () {
    const configs = yaml.load('configs.yml')
    const { host, user, password, authorization } = configs.database

    return { host, user, password, authorization }
  }

  /**
   * Function to throw error when it happens.
   */
  function _onError (err) {
    if (err) {
      log(`Ops! Algo de inexperado aconteceu: ${err}`)
      throw new Error(`Ops! Algo de inexperado aconteceu: ${err}`)
    }
  }

  /**
   * Connect to database or return an already open connection.
   */
  function _connect () {
    if (_databaseConnection) return _databaseConnection

    log('Criando instancia de conexão rest.')
    const {
      host,
      user: username,
      password,
      authorization
    } = _getDatabaseAuthData()

    const apiConfig = {
      baseURL: host
    }
    if (username && password) {
      apiConfig.auth = {
        username,
        password
      }
    }

    const api = axios.create(apiConfig)

    if (authorization) {
      api.defaults.headers.common.Authorization = authorization
    }

    _api = api
    log('Criado instancia de conexão rest!')

    /**
     * Return rest instance.
     */
    return api
  }

  function _loadSql (sqlToLoad) {
    try {
      if (sqlToLoad.toLowerCase().endsWith('.sql')) {
        const queryContent = readFileSync(`sql/${sqlToLoad}`, 'utf8')
        return queryContent
      }
      return sqlToLoad
    } catch (err) {}
  }

  /**
   * Executes the query on database.
   */
  async function executeQuery (queryToExecute) {
    try {
      if (!_api) _connect()
      const requestConfig = {}
      /**
       * Executed when is a select query.
       */
      requestConfig.url = queryToExecute.url
      requestConfig.method = queryToExecute.method | 'GET'
      if (queryToExecute.data) {
        requestConfig.data = queryToExecute.data
      }
      if (queryToExecute.params) {
        requestConfig.params = queryToExecute.params
      }
      if (queryToExecute.transformResponse) {
        requestConfig.transformResponse = [
          ...axios.defaults.transformResponse,
          data => {
            const sql = _loadSql(queryToExecute.transformResponse)
            return alasql(sql, [
              queryToExecute.rootResponse
                ? data[queryToExecute.rootResponse]
                : data
            ])
          }
        ]
      }
      if (queryToExecute.transformRequest) {
        requestConfig.transformRequest = [
          (data, headers) => {
            const sql = _loadSql(queryToExecute.transformRequest)
            return alasql(sql, [
              queryToExecute.rootRequest
                ? data[queryToExecute.rootRequest]
                : data
            ])
          },
          ...axios.defaults.transformRequest
        ]
      }

      log(`Executando a requisição ${requestConfig.method} na API.`)

      const response = await _api.request(requestConfig)
      return response.data
    } catch ({ message, ...error }) {
      return _onError(message)
    }
  }

  /**
   * Public methods
   */
  return {
    executeQuery
  }
})(YAML, log)

module.exports = adapter
