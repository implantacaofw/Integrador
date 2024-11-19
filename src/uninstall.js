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
 * Listen for the "uninstall" event, wich indicates
 * the process is uninstalled.
 */
srv.on('uninstall', function () {
  console.log('Uninstall complete.')
  console.log('The service exists:', srv.exists)
})

/**
 * Show error message.
 */
srv.on('error', () => console.log('error!!!'))

/**
 * Uninstalling the service.
 */
srv.uninstall()
