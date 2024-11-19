const { Service } = require('node-windows')
const { join } = require('path')

/**
 * Create a new service object.
 */
const options = {
  name: 'FW7.Integrador',
  description: 'Integrador entre a plataforma FW7 e outros sistemas',
  script: join(__dirname, 'server.js'),
  nodeOptions: ['--harmony'],
  env: {
    name: 'NODE_ENV',
    value: 'production'
  }
}

const srv = new Service(options)

/**
 * Listen for the "install" event, wich indicates
 * the process is available as a service.
 */
srv.on('install', () => {
  srv.start()
  console.log('Service installed!')
})

/**
 * Listen for the "start" event, wich indicates
 * the server can be accessed.
 */
srv.on('start', () => console.log('Service running.'))

srv.on('invalidinstallation', () => console.log('invalid!!!'))
srv.on('error', () => console.log('error!!!'))

/**
 * Installing as a service.
 */
srv.install()
