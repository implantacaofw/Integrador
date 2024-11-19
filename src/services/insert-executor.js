const { pipeP } = require('ramda')

/**
 * Colaborators services.
 */
const { log } = require('./logger')
const { chooseAdapter } = require('./adapter-chooser')
const { loadQueryConfiguration } = require('./query-configuration-loader')
const { extract } = require('./info-extractor')
const { executeQueries } = require('./query-executor')

const normalizeData = data => {
  const isString = data => typeof data === 'string'
  const addQuoteOrNot = value => (isString(value) ? `'${value}'` : value)

  if (!Array.isArray(data)) {
    return data
  }

  return data.reduce((acc, actual) => {
    if (actual === undefined) {
      return acc
    }

    if (!acc) {
      return `${acc}${addQuoteOrNot(actual)}`
    }

    return `${acc},${addQuoteOrNot(actual)}`
  }, '')
}

const normalizeKeys = data => {
  const toUpper = value => typeof value === 'string' && value.toUpperCase(value)

  if (!Array.isArray(data)) {
    return data
  }

  return data.reduce((acc, actual) => {
    if (actual === undefined) {
      return acc
    }

    if (!acc) {
      return `${acc}${toUpper(actual)}`
    }

    return `${acc},${toUpper(actual)}`
  }, '')
}

function * createGenerator (iterable) {
  yield * iterable
}

/**
 * Execute statement on database.
 */
const executeInsert = async (adapter, configs, keys, data) => {
  try {
    if (Array.isArray(data[0])) {
      const toInsert = Object.values(data)
      const queryGenerator = createGenerator(toInsert)

      /* eslint-disable-next-line */
      async function recursivillyExecute (values, done) {
        if (done) return

        try {
          await values && await executeQueries(adapter, [configs], {
            columns: normalizeKeys(keys),
            valores: `(${normalizeData(values)})`
          })
        } catch ({ message }) {
          console.error('Erro para executar query. Erro:', message)
          throw new Error(message)
        }

        if (!done) {
          const { value, done } = queryGenerator.next()
          await recursivillyExecute(value, done)
        }
      }

      try {
        const { value, done } = queryGenerator.next()
        await recursivillyExecute(value, done)
      } catch ({ message }) {
        console.error('Erro para inserir o registro. Erro:', message)
        throw new Error(`Erro para inserir o registro. Erro: ${message}`)
      }

      return []
    }

    const normalizedKeys = [keys.length ? normalizeKeys(keys) : undefined]
    const normalizedData = keys.length
      ? `${normalizeData(data)}`
      : `${normalizeData(data)}`

    const addedData = await executeQueries(adapter, [configs], {
      columns: `${normalizedKeys[0]}`,
      valores: normalizedData
    })

    return addedData
  } catch ({ message }) {
    console.log({ message })
    throw new Error(message)
  }
}

/**
 * Execute update on database.
 */
const executeUpdate = async (adapter, configs, data) => {
  try {
    await executeQueries(adapter, [configs], data)
  } catch ({ message }) {
    console.log({ message })
    throw new Error(message)
  }
}

/**
 * Create an object with configured data and configured queries.
 */
const prepareToExecute = async () => {
  try {
    log('Preparing data to execute inserts.')

    return {
      adapter: await chooseAdapter(),
      queries: await loadQueryConfiguration('inserts')
    }
  } catch ({ message }) {
    console.log({ message })
    throw new Error(message)
  }
}

/**
 * Run all inserts.
 */
const runInserts = (group, data) => async configs => {
  const { adapter, queries } = configs
  const queriesFromGroup = queries[group]

  try {
    /**
     * Use to store identifiers.
     */
    const mainIdentifier = {}

    const groupedQueryConfigurationGenerator = createGenerator(queriesFromGroup)
    for (const groupConfigs of groupedQueryConfigurationGenerator) {
      const flattedData = await extract(
        [groupConfigs],
        Array.isArray(data[0]) ? data[0] : [data[0]]
      )

      const { path, structure, store, update } = groupConfigs
      const structureKeys = structure && Object.keys(structure)

      if (store) {
        const noParams = []
        const result = await executeQueries(adapter, [groupConfigs], noParams)

        mainIdentifier[store] = `${result[0][store]}`
      }

      if (update) {
        const newData = { ...flattedData[0], ...mainIdentifier }
        await executeUpdate(adapter, groupConfigs, newData)
      }

      if (path) {
        const dataToInsert = flattedData[0][path].map(record =>
          structureKeys.map(key => record[key])
        )

        if (Array.isArray(dataToInsert)) {
          const storedValues = structureKeys.includes(
            Object.keys(mainIdentifier)[0]
          )
            ? Object.values(mainIdentifier)
            : structureKeys.reduce((acc, key) => {
              if (structure[key] === 'numero') {
                return Object.values(mainIdentifier)
              }

              return acc
            }, [])

          const addedData = dataToInsert.map(record =>
            executeInsert(adapter, groupConfigs, structureKeys, [
              ...record,
              ...storedValues
            ])
          )

          await Promise.all(addedData)
        }
      }

      if (!path && !update && structureKeys) {
        const dataToInsert = structureKeys.map(key => flattedData[0][key])

        try {
          const storedValues = structureKeys.includes(
            Object.keys(mainIdentifier)[0]
          )
            ? Object.values(mainIdentifier)
            : structureKeys.reduce((acc, key) => {
              if (structure[key] === 'numero') {
                return Object.values(mainIdentifier)
              }

              return acc
            }, [])

          await executeInsert(adapter, groupConfigs, structureKeys, [
            ...dataToInsert,
            ...storedValues
          ])
        } catch ({ message }) {
          log(`Erro ao inserir ou atualizar registro: ${message}`)
          throw new Error(`Erro ao inserir ou atualizar registro: ${message}`)
        }
      }

      if (!path && !structure && !store) {
        await executeInsert(
          adapter,
          groupConfigs,
          [],
          ...Object.values(mainIdentifier)
        )
      }
    }

    return Promise.resolve(mainIdentifier)
  } catch ({ message }) {
    console.log({ message })
    return Promise.reject(message)
  }
}

/**
 * Control insert execution flow.
 */
const execute = (group, data) =>
  pipeP(
    prepareToExecute,
    runInserts(group, data)
  )()

module.exports = {
  execute
}
