/**
 * Creating mock to 'firebase' module.
 */
jest.mock('firebase')
const firebase = require('firebase')

/**
 * Creating mock to 'yamljs' module.
 */
jest.mock('yamljs')
const { load } = require('yamljs')
load.mockReturnValue({
  service: { name: 'fakename', token: 'faketoken' }
})

/**
 * Service to be tested.
 */
const { monitoringPresence } = require('../src/services/presence')

describe('[Service] Presence', () => {
  /**
   * - Should be a function.
   * - Should call update function on connect.
   * - Should call onDisconnect when it going down.
   */

  it('deve ser uma função', () => {
    expect(typeof monitoringPresence).toBe('function')
  })

  xit('deve chamar a função de update quando conectar', async done => {
    const on = jest.fn()
    const update = jest.fn()

    jest.spyOn(firebase, 'database').mockImplementation(() => ({
      ref: jest.fn(() => ({
        on,
        update
      }))
    }))

    await monitoringPresence()

    expect(on).toHaveBeenCalled()
    expect(update).toHaveBeenCalledWith({
      '/integrators/faketoken/status': 'online'
    })

    done()
  })

  it('deve chamar a função de update quando desconectar', async done => {
    const on = jest.fn()
    const update = jest.fn()
    const onDisconnect = jest.fn(() => ({ update }))

    jest.spyOn(firebase, 'database').mockImplementation(() => ({
      ref: jest.fn(() => ({
        on,
        update,
        onDisconnect
      }))
    }))

    await monitoringPresence()

    expect(update).toHaveBeenCalledWith({ status: 'offline' })
    done()
  })
})
