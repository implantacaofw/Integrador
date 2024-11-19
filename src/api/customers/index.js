const { execute } = require('../../services/insert-executor')
const { chooseAdapter } = require('../../services/adapter-chooser')
const {
  loadQueryConfiguration
} = require('../../services/query-configuration-loader')
const { executeQueries } = require('../../services/query-executor')
const { log } = require('../../services/logger')

/**
 * Create an object with configured data and configured queries.
 */
const prepareToExecute = async () => {
  log('Preparing data to execute integration.')

  return {
    adapter: await chooseAdapter(),
    queries: await loadQueryConfiguration('selects'),
    dateToFilter: new Date()
  }
}

const saveCustomers = async ({ body }, res) => {
  const group = 'customers'
  const data = body[group]
  const totalCustomer = data.length
  const hasCustomers = totalCustomer >= 1

  if (hasCustomers) {
    log('=================')
    log(`Found ${totalCustomer} customers. Running inserts and updates!`)
    log('=================')

    const result = await execute(group, data)
    log({ result })
    return res.json(result)
  }

  res.sendStatus(204)
}

const saveCustomerSegments = async ({ body }, res) => {
  const group = 'customerSegments'
  const data = body[group]
  const totalCustomerSegments = data.length
  const hasCustomerSegments = totalCustomerSegments >= 1

  if (hasCustomerSegments) {
    log('=================')
    log(
      `Found ${totalCustomerSegments} customer segments. Running inserts and updates!`
    )
    log('=================')

    try {
      const result = await execute(group, data)
      log({ result })
      return res.json(result)
    } catch (error) {
      return res.status(500).json({ error: JSON.stringify(error) })
    }
  }

  return res.sendStatus(204)
}

const saveCustomerExtraInformations = async ({ body }, res) => {
  const group = 'customerExtraInformations'
  const data = body[group]
  const totalCustomerExtraInformations = data.length
  const hasCustomerExtraInformations = totalCustomerExtraInformations >= 1

  if (hasCustomerExtraInformations) {
    log('=================')
    log(
      `Found ${totalCustomerExtraInformations} customer extra informations. Running inserts and updates!`
    )
    log('=================')

    try {
      const result = await execute(group, data)
      log({ result })
      return res.json(result)
    } catch (error) {
      return res.status(500).json({ error: JSON.stringify(error) })
    }
  }

  return res.sendStatus(204)
}

const getCustomerFromClienteFW = async ({ params }, res) => {
  log('========================')
  log(`Consultado cliente com o codseq ${params.codseq}`)

  const { adapter } = await prepareToExecute()
  const foundCustomer = await executeQueries(
    adapter,
    [{ query: 'select_cliente_fw.sql' }],
    params
  )

  log(`Cliente encontrado: ${JSON.stringify(foundCustomer[0])}`)
  log('Retornando informação!')
  res.json(foundCustomer[0])
  log('========================')
}

const getCustomerFromDocument = async ({ params }, res) => {
  log('========================')
  log(`Consultado cliente com o documento ${params.document}`)

  /**
   * CNPJ or CPF.
   */
  const document = params.document

  const { adapter } = await prepareToExecute()
  const foundCustomer = await executeQueries(
    adapter,
    [{ query: 'select_cliente_documento.sql' }],
    { document }
  )

  log(`Cliente encontrado: ${JSON.stringify(foundCustomer[0])}`)
  log('Retornando informação!')
  res.json(foundCustomer[0])
  log('========================')
}

module.exports = {
  saveCustomers,
  saveCustomerSegments,
  getCustomerFromDocument,
  getCustomerFromClienteFW,
  saveCustomerExtraInformations
}
