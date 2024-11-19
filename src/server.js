const axios = require('axios')
const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const cors = require('cors')

const { terminate } = require('./services/process-terminator')

/**
 * Loading configs from yaml file.
 */
const YAML = require('yamljs')
const configs = YAML.load('configs.yml')
const PORT = configs.service.port

const app = express()

/**
 * Defining middlewares.
 */
app.use(cors('*'))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))
app.use(methodOverride())

/**
 * Loading routes.
 */
const routes = require('./api/routes')
app.use(routes)

/**
 * Running server.
 */
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)

  const isProduction = process.env.NODE_ENV === 'production'
  if (!isProduction) return

  const { name } = configs.service

  /*
  axios.post('https://discordapp.com/api/webhooks/761224988996141068/fhrZou466yP8Kh4WrELJkRMgYC73pnr57Yz7na1Mvwu51hNDflurjp-Z_zPCJx2STrmT', {
    content: 'Rodolfin aqui! 🐷',
    embeds: [
      {
        title: 'Daemon',
        description: `O serviço da ${name} acabou de reiniciar. OINC OINC`,
        color: 16426522
      }
    ]
  })
  */
})

server.setTimeout(60000 * 5)

/**
 * Services to run on start.
 */
const { selfRegister } = require('./services/self-register')
const { monitoringPresence } = require('./services/presence')
const { startIntegration } = require('./services/integration-executor')

/**
 * Boot function to start all services.
 */
async function boot () {
  /**
   * Call to self register on dashboard.
   */
  await selfRegister()

  /**
   * Start the process to monitor the service presence.
   */
  await monitoringPresence()

  /**
   * Start SQL processing.
   */
  await startIntegration()
}

boot()

const exitHandler = terminate(server, {
  coredump: false,
  timeout: 500
})

process.on('uncaughtException', exitHandler(1, 'Unexpected Error'))
process.on('unhandledRejection', exitHandler(1, 'Unhandled Promise'))
process.on('SIGTERM', exitHandler(0, 'SIGTERM'))
process.on('SIGINT', exitHandler(0, 'SIGINT'))
