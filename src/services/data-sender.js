const axios = require('axios')
const YAML = require('yamljs')

const firebase = require('../lib/firebase')
const { log } = require('./logger')
const splitPayload = require('./payload-spliter')

/**
 * Send data to the API.
 */
const send = async (
  data,
  apiUrl,
  port = null,
  endPoint,
  timeout = 600000,
  timesToRetry = 2,
  timesSent = 0
) => {
  const configs = YAML.load('configs.yml')
  const { token } = configs.service

  const baseURL = `${apiUrl}${port ? `:${port}` : ''}`
  const headers = {
    company_name: token,
    company_token: token
  }

  try {
    await axios({
      method: 'POST',
      timeout,
      baseURL,
      headers,
      url: endPoint,
      data
    })
    updateIntegrationStatus('online')
  } catch ({ message }) {
    if (timesSent < timesToRetry - 1) {
      log(`Error to send data. I gonna try again! (${timesSent + 1})`)
      await send(
        data,
        apiUrl,
        port,
        endPoint,
        timeout,
        timesToRetry,
        timesSent + 1
      )
    } else {
      updateIntegrationStatus('stopped')

      throw new Error(
        `Error to send data. URL: ${baseURL}${endPoint} - Message: ${message}`
      )
    }
  }
}

const updateIntegrationStatus = status => {
  // Updating status on firebase.
  const configs = YAML.load('configs.yml')
  const { token } = configs.service

  firebase
    .database()
    .ref()
    .update({ [`/integrators/${token}/status`]: status })
}

/**
 * Create a generator.
 */
function * getPayloadGenerator (data) {
  yield * data
}

/**
 * Send data to our API.
 */
const sendData = async (endPoint, data) => {
  try {
    /**
     * Integrator configs from yaml file.
     */
    const configs = YAML.load('configs.yml')
    const { url: apiUrl, port, timeout, timesToRetry } = configs.api

    if (!apiUrl) {
      throw new Error(
        'Você precisa configurar a url da API para envio dos dados.'
      )
    }

    if (!endPoint) {
      throw new Error('Você deve fornecer uma url para envio das informações.')
    }

    if (!data) {
      throw new Error('Nenhum dado fornecido para envio.')
    }

    const jsonString = JSON.stringify(data)
    const dataSize = Buffer.byteLength(jsonString)
    log(`Sending data [${dataSize} bytes].`)

    if (data && data.length > 1) {
      const arrayChunks = splitPayload(
        data,
        configs.service.splitBy || undefined
      )
      const totalChunks = arrayChunks.length
      const payloadGenerator = getPayloadGenerator(arrayChunks)

      log(`It will do ${totalChunks} requests.`)

      let sends = 1
      for (const payload of payloadGenerator) {
        log(
          `[${endPoint}]: Sending ${payload.length} items. [${sends}/${totalChunks}]`
        )
        await send(payload, apiUrl, port, endPoint, timeout, timesToRetry)
        sends++
      }

      log('Data sent.')
      return Promise.resolve()
    }

    await send(data, apiUrl, port, endPoint, timeout, timesToRetry)
    log('Data sent.')

    return Promise.resolve()
  } catch (err) {
    console.log(err)
    return Promise.reject(new Error(err.message))
  }
}

module.exports = {
  sendData
}
