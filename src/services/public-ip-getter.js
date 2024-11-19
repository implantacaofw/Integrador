const axios = require('axios')
const YAML = require('yamljs')

const firebase = require('../lib/firebase')
const configs = YAML.load('configs.yml')

const getPublicIp = async () => {
  const { token, port } = configs.service
  const { data: foundIP } = await axios.get('https://api.ipify.org')

  firebase
    .database()
    .ref(`/integrators/${token}`)
    .update({ integratorEndPoint: `http://${foundIP}:${port}` })
}

module.exports = { getPublicIp }
