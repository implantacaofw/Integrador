const { execute } = require('../../services/insert-executor')
const { log } = require('../../services/logger')

const saveOrder = async ({ body }, res) => {
  const group = 'orders'
  const data = body[group]
  const totalOrders = data.length
  const hasOrders = totalOrders >= 1

  if (hasOrders) {
    log('=================')
    log(`Found ${totalOrders} orders. Running inserts and updates!`)
    log('=================')

    try {
      const result = await execute(group, data)
      return res.json(result)
    } catch (error) {
      return res
        .status(500)
        .json({ error: JSON.stringify(error) })
    }
  }

  return res.sendStatus(204)
}

module.exports = {
  saveOrder
}
