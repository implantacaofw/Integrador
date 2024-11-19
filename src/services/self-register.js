const YAML = require('yamljs')
const firebase = require('../lib/firebase')

const configs = YAML.load('configs.yml')

/**
 * Verifyng if integrator is already registered.
 */
const isRegistered = async token => {
  const integrator = await firebase
    .database()
    .ref(`/integrators/${token}`)
    .once('value')

  return integrator.exists()
}

/**
 * Self registering the integrator.
 */
const selfRegister = async () => {
  const name = configs.service.name
  const token = configs.service.token

  if (!name && !token) {
    throw new Error(
      'Você precisa definir nas configurações o nome e o token do integrador.'
    )
  }

  try {
    const newIntegratorService = {
      name,
      token,
      registered: false,
      status: 'offline',
      syncing: false,
      created: new Date().toUTCString()
    }

    const exists = await isRegistered(token)
    !exists && firebase
      .database()
      .ref()
      .update({
        [`integrators/${token}`]: newIntegratorService
      })
  } catch ({ message }) {
    throw new Error('Erro ao registrar integrador.')
  }
}

module.exports = {
  selfRegister
}
