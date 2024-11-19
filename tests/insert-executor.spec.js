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
 * Info extractor colaborator.
 */
jest.mock('../src/services/info-extractor')
const { extract } = require('../src/services/info-extractor')

/**
 * Query executor mock.
 */
jest.mock('../src/services/query-executor')
const { executeQueries } = require('../src/services/query-executor')

/**
 * Service to be tested.
 */
const { execute } = require('../src/services/insert-executor')

xdescribe('[Service] Insert Executor:', () => {
  /**
   * - Should load database adapter.
   * - Should load inserts configuration.
   * - Should execute inserts.
   */

  const sqls = ['insert_pedido.sql', 'insert_itens_pedido.sql']

  beforeEach(() => {
    const executeQuery = jest.fn()
    const fakeAdapter = { executeQuery }
    chooseAdapter.mockImplementation(() => Promise.resolve(fakeAdapter))

    loadQueryConfiguration.mockImplementation(() => ({
      orders: [
        {
          sql: sqls[0],
          path: '',
          structure: {
            cod_seq: 'id'
          }
        },
        {
          sql: sqls[1],
          path: 'items',
          structure: {
            totalValue: 'totalValue',
            productId: 'product.id'
          }
        }
      ]
    }))

    extract.mockImplementation(() => [])
  })

  // Sample data received from SYNC project.
  const sampleData = [
    {
      id: '9944',
      idERP: 'Aguardando',
      items: [
        {
          totalValue: 10,
          product: {
            id: '45731',
            productDescription: 'SHORTS - SAIA LISTRADA'
          }
        },
        {
          totalValue: 20,
          product: {
            id: '43965',
            productDescription: 'BLUSA ALCINHA COTTON BÁSICA'
          }
        },
        {
          totalValue: 30,
          product: {
            id: '33389',
            productDescription: 'CONJUNTO BERMUDA NYLON ESTAMPADO COQUEIROS'
          }
        }
      ]
    }
  ]

  it('deve ser uma função', () => {
    expect(typeof execute).toBe('function')
  })

  it('deve carregar o adaptador de banco', async done => {
    await execute('orders', sampleData)

    expect(chooseAdapter).toHaveBeenCalled()
    done()
  })

  it('deve carregar a configuração de inserts', async done => {
    await execute('orders', sampleData)

    expect(loadQueryConfiguration).toHaveBeenCalledWith('inserts')
    done()
  })

  it('deve extrair os dados para serem inseridos', async done => {
    await execute('orders', sampleData)

    expect(extract).toHaveBeenCalledWith('orders', sampleData)
    done()
  })

  it('deve rodar os inserts com os dados extraídos', async done => {
    const executeQuery = jest.fn()
    const fakeAdapter = { executeQuery }
    chooseAdapter.mockImplementation(() => Promise.resolve(fakeAdapter))

    extract.mockImplementation(() => [
      {
        cod_seq: '9944',
        items: [
          {
            id: '243980',
            totalValue: 10,
            productId: '45731'
          },
          {
            id: '243981',
            totalValue: 20,
            productId: '43965'
          },
          {
            id: '243982',
            totalValue: 30,
            productId: '33389'
          }
        ]
      }
    ])

    await execute('orders', sampleData)

    expect(executeQueries).toHaveBeenCalledWith(
      fakeAdapter,
      [sqls[0]],
      ['cod_seq', '(9944)']
    )

    expect(executeQueries).toHaveBeenCalledWith(
      fakeAdapter,
      [sqls[1]],
      ['totalValue, productId', '(10, 45731), (20, 43965), (30, 33389)']
    )

    done()
  })
})
