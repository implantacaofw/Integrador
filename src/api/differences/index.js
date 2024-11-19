const fs = require('fs')
const { resolve } = require('path')

const { log } = require('../../services/logger')
const { chooseAdapter } = require('../../services/adapter-chooser')
const { executeQueries } = require('../../services/query-executor')
const { loadQueryConfiguration } = require('../../services/query-configuration-loader')

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

/**
 * Query by operation.
 */
const operationQuery = {
  order: 'select_confere_pedido.sql',
  product: 'select_confere_produto.sql'
}

/**
 * Get resources.
 */
const getResources = async (req, res) => {
  try {
    /**
     * Parameters.
     */
    const params = req.query

    log('Getting resources')

    /**
     * Execute SQL and get resources.
     */
    const { adapter } = await prepareToExecute()
    const foundRecords = await executeQueries(
      adapter,
      [{ query: operationQuery[params.operation] }],
      params
    )

    /**
     * Data with records and operation.
     */
    const data = {
      ...params,
      data: foundRecords
    }

    /**
     * Create file to send.
     */
    const content = JSON.stringify(data)
    const tempFilePath = resolve(__dirname, 'temp.json')
    fs.writeFileSync(tempFilePath, content)

    return res.download(tempFilePath, 'temp.json', function (err) {
      /**
       * Error.
       */
      if (err) log(err)

      /**
       * Remove file.
       */
      fs.unlinkSync(tempFilePath)

      log('Finished')
    })
  } catch ({ message }) {
    return res.status(400).json({ message })
  }
}

module.exports = {
  getResources
}
