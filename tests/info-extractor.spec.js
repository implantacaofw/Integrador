/**
 * Mock yaml module to return a fake configurations.
 */
jest.mock('../src/services/query-configuration-loader')
const {
  loadQueryConfiguration
} = require('../src/services/query-configuration-loader')

/**
 * Sample data received from SYNC project.
 */
const sampleData = [
  {
    id: '9944',
    items: [
      {
        id: '243980',
        totalValue: 10,
        product: {
          id: '45731'
        }
      },
      {
        id: '243981',
        totalValue: 20,
        product: {
          id: '43965'
        }
      },
      {
        id: '243982',
        totalValue: 30,
        product: {
          id: '33389'
        }
      }
    ]
  },
  {
    id: '9945',
    items: [
      {
        id: '243983',
        totalValue: 33.6,
        product: {
          id: '45395'
        }
      }
    ]
  }
]

/**
 * Service to be tested.
 */
const { extract } = require('../src/services/info-extractor')

xdescribe('Info Extractor:', () => {
  beforeAll(() => {
    loadQueryConfiguration.mockImplementation(() => ({
      orders: [
        {
          path: '',
          structure: {
            cod_seq: 'id'
          }
        },
        {
          path: 'items',
          structure: {
            id: 'id',
            totalValue: 'totalValue',
            productId: 'product.id'
          }
        }
      ]
    }))
  })

  it('deve ser uma função', () => {
    expect(typeof extract).toBe('function')
  })

  it('deve extrair o primeiro nível de atributos', () => {
    const group = 'orders'
    const result = extract(group, sampleData)

    expect(result).toEqual([
      expect.objectContaining({ cod_seq: '9944' }),
      expect.objectContaining({ cod_seq: '9945' })
    ])
  })

  it('deve extrair uma lista de atributos', () => {
    const group = 'orders'
    const result = extract(group, sampleData)

    expect(result).toEqual([
      expect.objectContaining({ items: expect.any(Array) }),
      expect.objectContaining({ items: expect.any(Array) })
    ])
  })

  it('deve navegar e transformar o objeto compando a chave', () => {
    const group = 'orders'
    const result = extract(group, sampleData)

    expect(result).toEqual([
      expect.objectContaining({
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
      }),
      expect.objectContaining({ items: expect.any(Array) })
    ])
  })

  it('deve extrair todos os dados e transformar em um objeto plano', () => {
    const group = 'orders'
    const result = extract(group, sampleData)

    expect(result).toEqual([
      expect.objectContaining({
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
      }),
      expect.objectContaining({
        items: [
          {
            id: '243983',
            totalValue: 33.6,
            productId: '45395'
          }
        ]
      })
    ])
  })
})
