const JDBC = require('jdbc')
const jinst = require('jdbc/lib/jinst')
const YAML = require('yamljs')

const { log } = require('../services/logger')

const DB_CONNECTION = {
  db: null
}

function createConnection (host, port, database, user, password) {
  if (DB_CONNECTION.db) return DB_CONNECTION.db

  console.log('Abrindo conexão com o banco.')

  // Database connection.
  const db = new JDBC({
    drivername: 'org.firebirdsql.jdbc.FBDriver',
    url: `jdbc:firebirdsql://${host}:${port}/${database}?charSet=latin1`,
    user,
    password
  })

  db.initialize(function (err) {
    if (err) {
      console.log('Erro ao inicializar conexão. Erro:', err)
    }
  })

  DB_CONNECTION.db = db
  return db
}

const firebird = {
  async executeQuery (queryToExecute, params = []) {
    const configs = YAML.load('configs.yml')
    const { host, port, database, user, password } = configs.database

    // Load firebird driver.
    if (!jinst.isJvmCreated()) {
      jinst.addOption('-Xrs')
      jinst.setupClasspath([
        `${__dirname}/drivers/firebird_v3/jaybird-full-3.0.5.jar`
      ])
    }

    const db = createConnection(host, port, database, user, password)

    const isSelect = query => {
      const splitedQuery = query.split(' ')

      return (
        splitedQuery[0].trim() === 'SELECT' ||
        splitedQuery[0].trim() === 'select' ||
        splitedQuery[0].substr(0, 6) === 'SELECT' ||
        splitedQuery[0].substr(0, 6) === 'select'
      )
    }

    // Execute when statement resolves.
    const resolveStatement = resolve => (err, resultSet) => {
      if (err) {
        throw new Error(`Error to execute query - Error: ${err}`)
      }

      if (typeof resultSet !== 'object') {
        log('QUERY FINISHED')
        resolve()
        return
      }

      resultSet.toObjArray((_, result) => {
        log('QUERY FINISHED')

        if (!result) {
          resolve()
          return
        }

        try {
          const transformedData = result.reduce((dataAcc, record) => {
            const keys = Object.keys(record)

            const newObject = keys.reduce((acc, key) => {
              const value = record[key]

              if (typeof value === 'object') {
                const decVal = value ? value.doubleValueSync() : ''
                return { ...acc, [key]: decVal }
              }

              return { ...acc, [key]: value }
            }, {})

            return [...dataAcc, newObject]
          }, [])

          resolve(transformedData)
        } catch ({ message }) {
          console.log(
            `Erro na conversão de resultSet no JDBC-FIREBIRD. ${message}`
          )
        }
      })
    }

    return new Promise((resolve, reject) => {
      db.reserve((connectionError, connObj) => {
        const conn = connObj.conn

        if (connectionError) {
          throw new Error(`Erro ao conectar no firebird - ${connectionError}`)
        }

        conn.createStatement((_, statement) => {
          log('START QUERYNG')

          // Execute SELECTs or INSERTs based on query.
          isSelect(queryToExecute)
            ? statement.executeQuery(queryToExecute, resolveStatement(resolve))
            : statement.executeUpdate(queryToExecute, resolveStatement(resolve))
        })

        db.release(connObj, function (err) {
          if (err) {
            console.log('Erro ao liberar a conexão!')
          }

          console.log('Conexão liberada!')
        })
      })
    })
  }
}

module.exports = firebird
