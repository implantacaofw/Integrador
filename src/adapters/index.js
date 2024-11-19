/**
 * Register all adapters.
 */
const firebird = require('./firebird_v4')
const firebirdV3 = require('./firebird_v3')
const informix = require('./informix')
const oracle = require('./oracle')
const oracle12 = require('./oracle_12')
const postgres = require('./postgres')
const cache = require('./cache')
const sqlserver = require('./sqlserver')
const mysql = require('./mysql')
const rest = require('./rest')

module.exports = {
  firebirdV3,
  firebird,
  informix,
  postgres,
  oracle,
  oracle12,
  cache,
  sqlserver,
  mysql,
  rest
}
