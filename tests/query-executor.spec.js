/**
 * Mock ourselves service that send data.
 */
jest.mock('../src/services/data-sender')
const { sendData } = require('../src/services/data-sender')

jest.mock('fs')
const { readFileSync } = require('fs')

/**
 * Service to test.
 */
const { executeQueries } = require('../src/services/query-executor')

describe('[Service] Query Executor:', () => {
  /**
   * - Should receive an adapter.
   * - Should receive a list of sql files.
   * - Should execute query using the adapter.
   * - Should have 'executeQuery' method.
   * - Should call method SEND to send data to our api.
   * - Should throw an error if no filter date is given.
   */

  it('deve ser uma função', () => {
    expect(typeof executeQueries).toBe('function')
  })

  it('deve disparar um erro se nenhum adaptador de banco for informado', async done => {
    const noAdapter = undefined

    await expect(executeQueries(noAdapter)).rejects.toThrow(
      'Nenhum adaptador de banco fornecido.'
    )

    done()
  })

  it('deve disparar um erro se a lista de queries não for informada', async done => {
    const adapter = { executeQuery: () => {} }
    const queries = undefined

    await expect(executeQueries(adapter, queries)).rejects.toThrow(
      'Nenhuma query para a execução foi encontrada.'
    )

    done()
  })

  it('deve disparar um erro se a lista de queries estiver vazia', async done => {
    const adapter = { executeQuery: () => {} }
    const queries = []

    await expect(executeQueries(adapter, queries)).rejects.toThrow(
      'Nenhuma query para a execução foi encontrada.'
    )

    done()
  })

  it('deve disparar um erro se o adaptador informado não tiver o método "executeQuery"', async done => {
    const adapter = {}
    const queries = []

    await expect(executeQueries(adapter, queries)).rejects.toThrow(
      'Adaptador recebido é inválido ou não implementa o método "executeQuery".'
    )

    done()
  })

  it('deve disparar um erro se nenhum filtro de data for informado', async done => {
    const adapter = { executeQuery: () => {} }
    const queries = ['']
    const dateToFilter = undefined

    await expect(
      executeQueries(adapter, queries, dateToFilter)
    ).rejects.toThrow('Nenhum parâmetro forcenido para as queries.')

    done()
  })

  it('deve executar as queries', async done => {
    readFileSync.mockReturnValue('')
    sendData.mockReturnValue([])

    const executeQuery = jest.fn(() => [])
    const adapter = { executeQuery }
    const queryList = ['queryOne', 'queryTwo']

    const dateToFilter = 'date'

    await executeQueries(adapter, queryList, dateToFilter)

    expect(executeQuery).toHaveBeenCalledTimes(2)
    done()
  })

  xit('deve fazer uma requisição para a API', async done => {
    const executeQuery = () => Promise.resolve({})
    const adapter = { executeQuery }
    const queryList = ['', '']

    const dateToFilter = 'date'

    await executeQueries(adapter, queryList, dateToFilter)

    expect(sendData).toHaveBeenCalled()
    done()
  })

  // TODO: Implement this functionality.
  xit('deve gerar um log quando a execução da query falhar', () => {})
})
