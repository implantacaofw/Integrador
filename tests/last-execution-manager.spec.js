/**
 * Mocking the original module.
 */
jest.mock('fs')
const { writeFileSync, readFileSync } = require('fs')

/**
 * Mocking the original module.
 */
jest.mock('moment')
const moment = require('moment')

/**
 * Mocking the original module.
 */
jest.mock('yamljs')
const YAML = require('yamljs')

/**
 * Creating mock to 'firebase' module.
 */
// jest.mock('../src/lib/firebase')
// const firebase = require('../src/lib/firebase')

/**
 * Mocking logger module.
 */
jest.mock('../src/services/logger')
const logger = require('../src/services/logger')

/**
 * Service to be tested.
 */
const {
  updateLastExecutionDate,
  loadLastExecutionDate
} = require('../src/services/last-execution-manager')

describe('[Service] Last Execution Manager:', () => {
  /**
   * - Should store a date.
   * - Should return a default date if there is no date yet.
   * - ...
   */

  beforeAll(() => {
    logger.log = jest.fn()
  })

  it('deve ser uma função', () => {
    expect(typeof updateLastExecutionDate).toBe('function')
    expect(typeof loadLastExecutionDate).toBe('function')
  })

  it('deve retornar uma data padrão', () => {
    const defaultDate = '1970-01-01 00:00:00'

    const format = jest.fn(() => ({ format: () => defaultDate }))
    moment.mockImplementation(format)

    const date = loadLastExecutionDate()

    expect(readFileSync).toHaveBeenCalled()
    expect(date).toBe(defaultDate)
  })

  it('deve retornar a data do arquivo', () => {
    const storedDate = '2018-11-19 10:20:00'
    readFileSync.mockReturnValue(storedDate)

    const date = loadLastExecutionDate()

    expect(date).toBe(storedDate)
  })

  it('deve salvar a data', async done => {
    const fileName = 'last-execution.txt'
    const actualDate = '1970-01-01 00:00:00'

    const format = jest.fn(() => ({ format: () => actualDate }))
    moment.mockImplementation(format)

    const fn = jest.fn(() => {})
    writeFileSync.mockImplementation(fn)

    const date = await updateLastExecutionDate()

    expect(fn).toHaveBeenCalledWith(fileName, actualDate)
    expect(date).toBe('1970-01-01 00:00:00')
    done()
  })

  xit('deve salvar no firebase a data em que rodou as queries', async done => {
    const token = 'whateverfw7mutenroshi'
    YAML.load = jest.fn(() => ({ service: { token } }))

    const update = jest.fn()

    jest.spyOn(firebase, 'database').mockImplementation(() => ({
      ref: jest.fn(() => ({
        update
      }))
    }))

    await updateLastExecutionDate()

    expect(update).toHaveBeenCalledWith({
      [`/integrators/${token}/lastExecution`]: expect.any(String)
    })

    done()
  })
})
