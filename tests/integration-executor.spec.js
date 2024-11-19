/**
 * Mock to original module 'yamls'
 */
jest.mock('yamljs')
const YAML = require('yamljs')

/**
 * Timer colaborator.
 */
jest.mock('../src/services/timer')
const { awaitTime } = require('../src/services/timer')

/**
 * Adapter chooser colaborator.
 */
jest.mock('../src/services/adapter-chooser')
const { chooseAdapter } = require('../src/services/adapter-chooser')

/**
 * Query loader configuration colaborator.
 */
jest.mock('../src/services/query-configuration-loader')
const {
  loadQueryConfiguration
} = require('../src/services/query-configuration-loader')

/**
 * Query exector colaborator.
 */
jest.mock('../src/services/query-executor')
const { executeQueries } = require('../src/services/query-executor')

jest.mock('../src/services/last-execution-manager.js')
const {
  loadLastExecutionDate
} = require('../src/services/last-execution-manager')

/**
 * Data sender colaborator.
 */
jest.mock('../src/services/data-sender')
const { sendData } = require('../src/services/data-sender')

/**
 * Service to be tested.
 */
const { startIntegration } = require('../src/services/integration-executor')

describe('[Service] Integration Executor:', () => {
  /**
   * - Should load the database adapter.
   * - Should load queries configuration.
   * - Should prepare an object with adapter reference and query list.
   * - Should execute queries and send collected data.
   * - Should update datetime from last execution.
   */

  beforeEach(() => {
    chooseAdapter.mockReset()
    loadQueryConfiguration.mockReset()
    sendData.mockReset()
  })

  // Funtion to prepare environment.
  const givenConfiguration = () => {
    YAML.load = jest.fn()

    const executeQuery = jest.fn()
    const fakeAdapter = { executeQuery }
    chooseAdapter.mockImplementation(() => Promise.resolve(fakeAdapter))

    const query = 'fake select'
    const fakeConfig = [{ query }]
    loadQueryConfiguration.mockImplementation(() => Promise.resolve(fakeConfig))

    awaitTime.mockImplementation(() => Promise.resolve())
  }

  it('deve ser uma função', () => {
    expect(typeof startIntegration).toBe('function')
  })

  it('deve carregar o adaptador de banco', async done => {
    givenConfiguration()

    await startIntegration()

    expect(chooseAdapter).toHaveBeenCalled()
    done()
  })

  it('deve carregar a lista de queries configuradas', async done => {
    givenConfiguration()

    await startIntegration()

    expect(loadQueryConfiguration).toHaveBeenCalled()
    done()
  })

  it('deve carregar todas as configurações para rodar a integração', async done => {
    const executeQuery = jest.fn()
    const fakeAdapter = { executeQuery }
    chooseAdapter.mockReturnValue(fakeAdapter)

    const fakeConfig = [{}]
    loadQueryConfiguration.mockReturnValue(fakeConfig)

    const defaultDate = '1970-01-01 00:00:00'
    loadLastExecutionDate.mockReturnValue(defaultDate)

    await startIntegration()

    expect(chooseAdapter).toHaveBeenCalled()
    expect(loadQueryConfiguration).toHaveBeenCalled()
    expect(loadLastExecutionDate).toHaveBeenCalled()
    done()
  })

  it('deve executar as queries', async done => {
    const executeQuery = jest.fn()
    const fakeAdapter = { executeQuery }
    chooseAdapter.mockReturnValue(fakeAdapter)

    const query = 'fake select'
    const fakeConfig = [{ query }]
    loadQueryConfiguration.mockReturnValue(fakeConfig)

    const defaultDate = '1970-01-01 00:00:00'
    loadLastExecutionDate.mockReturnValue(defaultDate)

    await startIntegration()

    expect(executeQueries).toHaveBeenCalledWith(
      fakeAdapter,
      fakeConfig,
      defaultDate
    )
    done()
  })
})
