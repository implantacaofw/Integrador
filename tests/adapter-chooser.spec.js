/**
 * Creating mock to 'yamljs' module.
 */
jest.mock('yamljs')
const YAML = require('yamljs')

const { firebird } = require('../src/adapters')

/**
 * Service to test.
 */
const { chooseAdapter } = require('../src/services/adapter-chooser')

describe('[Service] Adapter Chooser:', () => {
  /**
   * - Should throw an error if there is no dialect.
   * - Should choose an adapter based on dialect config.
   * - Should throw an error if the is no dialect.
   */

  it('deve ser uma função', () => {
    expect(typeof chooseAdapter).toBe('function')
  })

  it('deve disparar um erro se o dialeto do banco não for configurado', async done => {
    YAML.load = () => ({ database: {} })

    await expect(chooseAdapter('/no-adapter/')).rejects.toThrow(
      'Você precisa definir qual o dialeto do banco.'
    )

    done()
  })

  it('deve retornar o adaptador de banco de acordo com o dialeto configurado', async done => {
    const dialect = 'firebird'
    YAML.load = () => ({ database: { dialect } })

    const adapter = await chooseAdapter(dialect)

    expect(adapter).toBe(firebird)
    done()
  })

  it('deve disparar um erro se o dialeto informado não existir', async done => {
    const dialect = 'fakedialect'
    YAML.load = () => ({ database: { dialect } })

    await expect(chooseAdapter(dialect)).rejects.toThrow(
      'O dialeto definido nas configurações não é suportado.'
    )

    done()
  })
})
