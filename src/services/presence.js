const YAML = require('yamljs')
const firebase = require('../lib/firebase')

const configs = YAML.load('configs.yml')

/**
 * Update the integrator status to ONLINE.
 */
const setToOnline = token =>
  firebase
    .database()
    .ref()
    .update({ [`/integrators/${token}/status`]: 'online' })

/**
 * Start the presence system.
 */
const monitoringPresence = () => {
  const token = configs.service.token

  // Execute when online.
  firebase
    .database()
    .ref('.info/connected')
    .on('value', snapshot => {
      if (snapshot.val()) { setToOnline(token) }
    })

  // Execute onDisconnect.
  firebase
    .database()
    .ref(`/integrators/${token}`)
    .onDisconnect()
    .update({ status: 'offline' })
}

module.exports = {
  monitoringPresence
}
