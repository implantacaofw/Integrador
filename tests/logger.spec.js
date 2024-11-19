/**
 * Mocking the original firebase module.
 */
jest.mock('firebase')
const firebase = require('firebase')

/**
 * Creating mock to 'yamljs' module.
 */
jest.mock('yamljs')
const { load } = require('yamljs')
load.mockReturnValue({
  service: { token: 'faketoken' }
})

/**
 * Service to be tested.
 */
const { log: logContent } = require('../src/services/logger')

describe('[Service] Logger:', () => {
  /**
   * - Should log nothing when in test environment.
   * - Should log on console when in development environment.
   * - Should write a log file when in production environment.
   */

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
  })

  it('deve ser uma função', () => {
    expect(typeof logContent).toBe('function')
  })

  it('deve ignorar os logs quando estiver rodando em ambiente de teste', () => {
    process.env.NODE_ENV = 'test'

    const log = jest.fn()
    global.console = { log }

    logContent('fakecontent')

    expect(log).not.toHaveBeenCalled()
  })

  it('deve logar quando estiver em ambiente de desenvolvimento', () => {
    process.env.NODE_ENV = 'dev'

    const log = jest.fn()
    global.console = { log }

    const fakeContent = 'content'
    logContent(fakeContent)

    expect(log).toHaveBeenCalledWith(expect.any(String), '::', fakeContent)
  })

  xit('deve salvar todos os logs no firebase quando estiver em ambiente de produção', async done => {
    process.env.NODE_ENV = 'production'

    const push = jest.fn()

    jest.spyOn(firebase, 'database').mockImplementation(() => ({
      ref: jest.fn(() => ({
        push
      }))
    }))

    const fakeContent = 'content'
    logContent(fakeContent)

    expect(push).toHaveBeenCalled()
    done()
  })
})
