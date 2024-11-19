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
        `${__dirname}/drivers/sqlserver/mssql-jdbc-8.2.0.jre8.jar`
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
function _isASelectQuery(query) {
  const sanitizedQuery = query.trim().toUpperCase(); // Remove espaços em branco e deixa em maiúsculas
  return sanitizedQuery.startsWith('SELECT') || sanitizedQuery.startsWith('WITH'); // Verifica o início da query
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
    const { host, database, user, password } = _getDatabaseAuthData()
    const db = new JDBC({
      drivername: 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
      url: `jdbc:sqlserver://;serverName=${host};databaseName=${database};`,
      maxpoolsize: 100,
      minpoolsize: 1,
      user,
      password
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
      function executeQuery(queryToExecute) {
        return new Promise(function (resolve, reject) {
          try {
            _getConnectionObject(function (connectionObject) {
              log(`Usando a conexão ${connectionObject.uuid} para executar operações no banco.`);

              log(`Determinado que a query é do tipo: ${_isASelectQuery(queryToExecute) ? 'SELECT' : 'UPDATE/INSERT'}`);
              
              // Escolha do método de execução com base no tipo da query
              if (_isASelectQuery(queryToExecute)) {
                return connectionObject.conn.createStatement(function (err, statement) {
                  if (err) return _onError(err, reject);

                  log('Executando a query no banco (SELECT).');
                  statement.executeQuery(queryToExecute, function (err, resultSet) {
                    if (err) return _onError(err, reject);

                    if (!resultSet || !_isObject(resultSet)) {
                      log('Query finalizada sem resultados.');
                      return resolve([]);
                    }

                    resultSet.toObjArray(function (err, results) {
                      if (err) return _onError(err, reject);

                      log('Query SELECT finalizada com sucesso!');
                      return resolve(_normalizeData(results));
                    });
                  });
                });
              }

              // Para operações de modificação
              connectionObject.conn.createStatement(function (err, statement) {
                if (err) return _onError(err, reject);

                log('Executando a query no banco (UPDATE/INSERT).');
                statement.executeUpdate(queryToExecute, function (err, count) {
                  if (err) return _onError(err, reject);

                  log(`Query UPDATE/INSERT finalizada com sucesso! ${count} registros afetados.`);
                  return resolve(count);
                });
              });
            }, reject);
          } catch ({ message }) {
            return _onError(message, reject);
          }
        });
      }


  /**
   * Public methods
   */
  return {
    executeQuery
  }
})(JDBC, jinst, YAML, log)

module.exports = adapter
