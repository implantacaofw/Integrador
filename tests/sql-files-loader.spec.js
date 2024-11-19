/**
 * Mock fs module to read directories.
 */
jest.mock('fs')
const { readdirSync } = require('fs')
readdirSync.mockReturnValue([])

/**
 * Service to test.
 */
const { loadSqlFiles } = require('../src/services/sql-files-loader')

describe('[Service] Start Process:', () => {
  /**
   * - Should read the directory passed by parameter.
   * - Should throw an error if any path is not given.
   * - Should throw an error if there are no sql files.
   * - Should read all sql files and discart other file types.
   * - Should order a list of sqls to execute.
   * - Should execute sql.
   * - Should update date time from last execution.
   */

  beforeEach(done => {
    readdirSync.mockReturnValue([])
    done()
  })

  it('deve ser uma função.', () => {
    expect(typeof loadSqlFiles).toBe('function')
  })

  it('deve ler o diretório "/fakepath/"', async done => {
    readdirSync.mockReturnValue(['file.sql'])

    const pathToRead = '/fakepath/'
    await loadSqlFiles(pathToRead)

    expect(readdirSync).toHaveBeenCalledWith(pathToRead)
    done()
  })

  it('deve disparar um erro se nenhum diretório for informado', async done => {
    await expect(loadSqlFiles()).rejects.toThrowError(
      'Você precisa informar o diretório onde estão os SQLs.'
    )

    done()
  })

  it('deve disparar um erro se no diretório informado não existir nenhum arquivo', async done => {
    await expect(loadSqlFiles('/fakepath/')).rejects.toThrowError(
      'Nenhum arquivo SQL encontrado no diretório informado.'
    )

    done()
  })

  it('deve ler apenas arquivos .sql e descartar os demais', async done => {
    readdirSync.mockReturnValue(['file.sql', 'another_file.txt'])

    const files = await loadSqlFiles('/fakepath/')

    expect(readdirSync).toHaveBeenCalled()
    expect(files).toHaveLength(1)
    done()
  })

  it('deve ordenar a lista de sqls', async done => {
    readdirSync.mockReturnValue([
      '002_file.sql',
      '001_file.sql',
      '004_ab.sql',
      '003_aa.sql'
    ])

    const files = await loadSqlFiles('/fakepath/')

    expect(files).toEqual([
      '001_file.sql',
      '002_file.sql',
      '003_aa.sql',
      '004_ab.sql'
    ])
    done()
  })
})
