/**
 * Mocking the original module yamljs.
 */
jest.mock('yamljs')
const YAML = require('yamljs')

/**
 * Load jest fake timers (setTimeout, setInterval).
 */
jest.useFakeTimers()

/**
 * Service to test.
 */
const { awaitTime } = require('../src/services/timer')

describe('[Service] Timer:', () => {
  /**
   * - Should respect the await time configured.
   * - Should throw an error if there is no time configuration.
   * - Should time interval grather then 60000 miliseconds (1 minute)?
   */

  it('deve ser uma função', () => {
    expect(typeof awaitTime).toBe('function')
  })

  it('deve disparar um erro se o intervalo de execução do serviço não for informado', async done => {
    YAML.load = jest.fn(() => ({ service: {} }))

    await expect(awaitTime()).rejects.toThrow(
      'Você precisa configurar o intervalo entre uma integração e outra.'
    )

    done()
  })

  it('deve esperar o intervalo configurado', () => {
    const interval = 1000
    YAML.load = jest.fn(() => ({ service: { interval } }))

    awaitTime()

    expect(setTimeout).toHaveBeenCalledTimes(1)
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), interval)
  })
})
