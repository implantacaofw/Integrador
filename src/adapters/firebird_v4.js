const JDBC = require('jdbc')
const jinst = require('jdbc/lib/jinst')
const YAML = require('yamljs')

const { log } = require('../services/logger')

const adapter = (function (JDBC, jinst, yaml, log) {
  /**
   * (SINGLETON) Store database connection.
   */
  let _databaseConnection = null
  let _connection = null

  /**
   * Load all needed database drivers to stablish connection.
   */
  function _loadDatabaseDrivers () {
    if (!jinst.isJvmCreated()) {
      jinst.addOption('-Xrs')
      jinst.setupClasspath([
        `${__dirname}/drivers/firebird_v4/jaybird-full-4.0.0.java8.jar`
      ])
    }
  }

  /**
   * Load all database data to connection.
   */
  function _getDatabaseAuthData () {
    const configs = yaml.load('configs.yml')
    const { host, port, database, user, password } = configs.database

    return { host, port, database, user, password }
  }

  /**
   * Function to throw error when it happens.
   */
  function _onError (err, reject) {
    if (reject && err) {
      log(`Ops! Algo de inexperado aconteceu: ${err}`)
      return reject(new Error(`Ops! Algo de inexperado aconteceu: ${err}`))
    }

    if (err) {
      log(`Ops! Algo de inexperado aconteceu: ${err}`)
      throw new Error(`Ops! Algo de inexperado aconteceu: ${err}`)
    }
  }

  /**
   * Check if it is a select query.
   */
  function _isASelectQuery (query) {
    const splitedQuery = query.split(' ')

    return (
      splitedQuery[0].trim() === 'SELECT' ||
      splitedQuery[0].trim() === 'select' ||
      splitedQuery[0].substr(0, 6) === 'SELECT' ||
      splitedQuery[0].substr(0, 6) === 'select'
    )
  }

  /**
   * Test if given parameter is an object.
   */
  function _isObject (thing) {
    return typeof thing === 'object'
  }

  /**
   * Normalize data to be sent.
   */
  function _normalizeData (data) {
    try {
      return data.reduce(function (records, record) {
        const keys = Object.keys(record)
        const normalizedData = keys.reduce(function (acc, key) {
          const value = record[key]

          if (_isObject(value)) {
            const decVal = value ? value.doubleValueSync() : ''
            return { ...acc, [key]: decVal }
          }

          return { ...acc, [key]: value }
        }, {})

        return [...records, normalizedData]
      }, [])
    } catch ({ message }) {
      _onError(message)
    }
  }

  /**
   * Connect to database or return an already open connection.
   */
  function _connect () {
    if (_databaseConnection) return _databaseConnection

    log('Carregando drivers de conexão com o banco.')
    _loadDatabaseDrivers()

    log('Abrindo conexão com o banco.')
    const { host, port, database, user, password } = _getDatabaseAuthData()
    const db = new JDBC({
      url: `jdbc:firebirdsql://${host}:${port}/${database}?charSet=latin1`,
      drivername: 'org.firebirdsql.jdbc.FBDriver',
      maxpoolsize: 100,
      minpoolsize: 1,
      password,
      user
    })

    /**
     * Stablishing connection.
     */
    db.initialize(_onError)
    _databaseConnection = db
    log('Conexão com o banco realizada com sucesso!')

    /**
     * Return connection.
     */
    return db
  }

  /**
   * Get the first open connection. No more release it.
   */
  function _getConnectionObject (callback, reject) {
    if (_connection) return callback(_connection)

    /**
     * Get database connection.
     */
    const connection = _connect()

    /**
     * Getting conneciton from the pool.
     */
    connection.reserve(function (err, connectionObject) {
      /**
       * Throw!
       */
      if (err) return _onError(err, reject)

      _connection = connectionObject
      callback(connectionObject)
    })
  }

  /**
   * Executes the query on database.
   */
  function executeQuery (queryToExecute) {
    return new Promise(function (resolve, reject) {
      try {
        /**
         * Reserve and execute query.
         */
        _getConnectionObject(function (connectionObject) {
          log(`Usando a conexão ${connectionObject.uuid} para executar operações no banco.`)

          /**
           * Executed when is a select query.
           */
          if (_isASelectQuery(queryToExecute)) {
            return connectionObject.conn.createStatement(function (err, statement) {
              /**
               * Throw!
               */
              if (err) return _onError(err, reject)

              /**
               * Execute!
               */
              log('Executando a query no banco.')
              statement.executeQuery(queryToExecute, function (err, resultSet) {
                /**
                 * Throw!
                 */
                if (err) return _onError(err, reject)

                /**
                 * No records found.
                 */
                if (!resultSet || !_isObject(resultSet)) {
                  log('Query finalizada com sucesso!')
                  return resolve()
                }

                resultSet.toObjArray(function (err, results) {
                  /**
                   * Throw!
                   */
                  if (err) return _onError(err, reject)

                  log('Query finalizada com sucesso!')

                  const normalizedData = _normalizeData(results)
                  return resolve(normalizedData)
                })
              })
            })
          }

          /**
           * Executed when is an update or insert query.
           */
          return connectionObject.conn.createStatement(function (err, statement) {
            /**
             * Throw!
             */
            if (err) return _onError(err, reject)

            /**
             * Execute!
             */
            statement.executeUpdate(queryToExecute, function (err, count) {
              /**
               * Throw!
               */
              if (err) return _onError(err, reject)

              return resolve(count)
            })
          })
        }, reject)
      } catch ({ message }) {
        return _onError(message, reject)
      }
    })
  }

  /**
   * Public methods
   */
  return {
    executeQuery
  }
})(JDBC, jinst, YAML, log)

module.exports = adapter
