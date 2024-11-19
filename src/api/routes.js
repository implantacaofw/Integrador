const { Router } = require('express')
const router = new Router()

/**
 * Route list.
 */
const { saveOrder } = require('./orders')
const { healthCheck } = require('./health-check')
const { getResources } = require('./differences')
const {
  saveCustomers,
  saveCustomerSegments,
  getCustomerFromDocument,
  getCustomerFromClienteFW,
  saveCustomerExtraInformations
} = require('./customers')

/**
 * Route register.
 */
router.get('/health-check', healthCheck)
router.post('/orders', saveOrder)

router.post('/customers', saveCustomers)
router.get('/customers/:codseq', getCustomerFromClienteFW)
router.get('/customers/document/:document', getCustomerFromDocument)

router.post('/customer-segments', saveCustomerSegments)
router.post('/customer-extra-informations', saveCustomerExtraInformations)

router.get('/giveme', getResources)

module.exports = router
