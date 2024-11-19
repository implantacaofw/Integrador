const { readFileSync } = require('fs')

/**
 * Log contents based on environment configuration.
 */
const { log } = require('./logger')

/**
 * This service sends data for our API.
 */
const { sendData } = require('./data-sender')

/**
 * Service used to replace queries placeholders.
 */
const { replace } = require('./placeholder-replacer')

/**
 * Execute all process to grab infos and send data to our API.
 */
const executeQueries = async (adapter, queries, params) => {
  if (!adapter) {
    throw new Error('Nenhum adaptador de banco fornecido.')
  }

  const { executeQuery } = adapter
  if (!executeQuery) {
    throw new Error(
      'Adaptador recebido é inválido ou não implementa o método "executeQuery".'
    )
  }

  if (!queries || !queries.length) {
    throw new Error('Nenhuma query para a execução foi encontrada.')
  }

  if (!params) {
    throw new Error('Nenhum parâmetro forcenido para as queries.')
  }

  // Transform iterable into a generator.
  function * getQueryGenerator (queryList) {
    yield * queryList
  }

  // If there is just one query to execute, it will return the affected rows.
  if (queries.length === 1) {
    log('====================')
    log('Querying.')

    try {
      let queryToExecute = null
      if (typeof queries[0].query === 'string') {
        const queryContent = readFileSync(`sql/${queries[0].query}`, 'utf8')
        queryToExecute = replace(queryContent, params)
      } else if (typeof queries[0].query === 'object') {
        queries[0].query.params = { ...params, ...queries[0].query.params }
        queryToExecute = queries[0].query
      }

      log({ queryToExecute })

      const result = await executeQuery(queryToExecute)
      const totalResults = result ? result.length : 0

      log(`Found ${totalResults} row(s).`)
      log('Finished.')
      return Promise.resolve(result)
    } catch ({ message }) {
      log(
        `Erro ao executar a query e obter as linhas afetadas. O erro foi: ${message}`
      )

      log('//////////////////////////////////////////')
      log('TERMINADO PROCESSO DE EXECUÇÃO DE QUERIES COM ERRO.')
      log('//////////////////////////////////////////')

      throw new Error(
        `Erro ao executar a query e obter as linhas afetadas. O erro foi: ${message}`
      )
    }
  }

  const queryGenerator = getQueryGenerator(queries)
  async function recursiveQueryExecutor (value, done) {
    if (!value) return

    const { query, route } = value

    log('====================')
    log(`Querying :: ${route}`)

    try {
      // Load query content.
      let queryToExecute = null

      if (typeof query === 'string') {
        const queryContent = readFileSync(`sql/${query}`, 'utf8')
        queryToExecute = replace(queryContent, params)
      } else if (typeof query === 'object') {
        query.params = { ...params, ...query.params }
        queryToExecute = query
      }
      log({ queryToExecute })

      const result = await executeQuery(queryToExecute)
      const totalResults = result ? result.length : 0

      log(`Found ${totalResults} row(s).`)

      if (totalResults) {
        await sendData(route, result)
      }

      if (!done) {
        const { value, done } = queryGenerator.next()
        await recursiveQueryExecutor(value, done)
      }
    } catch ({ message }) {
      log(
        `Erro ao executar a query e obter as linhas afetadas. O erro foi: ${message}`
      )

      throw new Error(
        `Erro ao executar a query e obter as linhas afetadas. O erro foi: ${message}`
      )
    }
  }

  try {
    const { value, done } = queryGenerator.next()
    await recursiveQueryExecutor(value, done)

    log('//////////////////////////////////////////')
    log('TERMINADO PROCESSO DE EXECUÇÃO DE QUERIES.')
    log('//////////////////////////////////////////')

    return Promise.resolve()
  } catch ({ message }) {
    log('//////////////////////////////////////////')
    log('TERMINADO PROCESSO DE EXECUÇÃO DE QUERIES COM ERRO.')
    log('//////////////////////////////////////////')

    return Promise.reject(message)
  }
}

module.exports = {
  executeQueries
}
