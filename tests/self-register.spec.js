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
const { selfRegister } = require('../src/services/self-register')

describe('[Service] Self Register', () => {
  /**
   * - Validate config infos.
   * - Call method to self register service.
   * - Throw an error if request fail.
   * - Verify whether service is already registered.
   */

  xit('deve disparar um erro se a configuração do serviço não for encontrada.', async done => {
    load.mockReturnValue({ service: {} })

    await expect(selfRegister()).rejects.toThrow(
      'Você precisa definir nas configurações o nome e o token do integrador.'
    )

    done()
  })

  it('deve fazer uma requisição para registrar o serviço', async done => {
    const update = jest.fn()
    const once = jest.fn(() => ({
      exists: () => false
    }))

    jest.spyOn(firebase, 'database').mockImplementation(() => ({
      ref: jest.fn(() => ({
        update,
        once
      }))
    }))

    await selfRegister()

    expect(once).toHaveBeenCalled()
    expect(update).toHaveBeenCalled()
    done()
  })

  it('deve disparar um erro quando a requisição de registro falhar', async done => {
    const update = jest.fn(() => {
      throw new Error()
    })

    jest.spyOn(firebase, 'database').mockImplementation(() => ({
      ref: jest.fn(() => ({ update }))
    }))

    await expect(selfRegister()).rejects.toThrow()

    done()
  })

  it('deve não fazer a requisição de registro se isso já foi feito antes', async done => {
    const update = jest.fn()
    const once = jest.fn(() => ({
      exists: () => true
    }))

    jest.spyOn(firebase, 'database').mockImplementation(() => ({
      ref: jest.fn(() => ({
        update,
        once
      }))
    }))

    await selfRegister()

    expect(once).toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
    done()
  })
})
