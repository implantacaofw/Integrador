/**
 * Mock yaml module to return a fake configurations.
 */
jest.mock('yamljs')
const YAML = require('yamljs')

/**
 * Mock fs module to read directories and files.
 */
jest.mock('fs')
const { readFileSync, readdirSync } = require('fs')

/**
 * Service to be tested.
 */
const {
  loadQueryConfiguration
} = require('../src/services/query-configuration-loader')

describe('[Service] Query Configuration Loader:', () => {
  /**
   * - Should load query configurations.
   * - Should load query configurations based on file name param.
   * - Should throw an error if there is no configuration.
   * - Should throw an error if there is no configuration file.
   * - Should validate if there are all sql files configured.
   */

  it('deve ser uma função', () => {
    expect(typeof loadQueryConfiguration).toBe('function')
  })

  it('deve disparar um erro se o arquivo de configuração não existir', async done => {
    YAML.load = jest.fn(() => ({ directories: { sqls: 'sql' } }))
    readdirSync.mockReturnValue([])

    await expect(loadQueryConfiguration()).rejects.toThrow(
      'O arquivo de configuração das queries não existe.'
    )

    done()
  })

  it('deve carregar o arquivo de configuração das queries', async done => {
    YAML.load = jest.fn(() => ({ directories: { sqls: 'sql' } }))

    readdirSync.mockReturnValue(['file1.json', 'file2.json'])
    readFileSync.mockReturnValue(
      '[{ "query": "query.sql", "route": "/route" }]'
    )

    const result = await loadQueryConfiguration('file1.json')

    expect(result).toEqual([{ query: 'query.sql', route: '/route' }])
    done()
  })

  it('deve carregar o arquivo de configuração dos inserts', async done => {
    YAML.load = jest.fn(() => ({ directories: { sqls: 'sql' } }))

    readdirSync.mockReturnValue(['file1.json', 'file2.json'])
    readFileSync.mockReturnValue(
      '{ "orders": [{ "sql": "insert_pedidos.sql", "path": "" }] }'
    )

    const result = await loadQueryConfiguration('file2.json')

    expect(result).toEqual({
      orders: [{ sql: 'insert_pedidos.sql', path: '' }]
    })

    done()
  })

  it('deve disparar um erro se o arquivo de configuração estiver vazio', async done => {
    const expectedConfigurations = undefined
    readdirSync.mockReturnValue(['file.json'])
    readFileSync.mockReturnValue(expectedConfigurations)

    await expect(loadQueryConfiguration('file.json')).rejects.toThrow(
      'O arquivo de configuração de queries e rotas está vazio.'
    )

    done()
  })
})
