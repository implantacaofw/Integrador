/**
 * Service to be tested.
 */
const { replace } = require('../src/services/placeholder-replacer')

describe('[Service] Placeholder Replacer:', () => {
  it('deve ser uma função', () => {
    expect(typeof replace).toBe('function')
  })

  it('deve substituir o placeholder das colunas', () => {
    const query = 'INSERT INTO table :columns'
    const params = { columns: 'columns' }

    const result = replace(query, params)

    expect(result).toBe('INSERT INTO table columns')
  })

  it('deve substituir o placeholder dos valores', () => {
    const query = 'INSERT INTO table :columns VALUES :valores'
    const params = { columns: 'columns', valores: 'values' }

    const result = replace(query, params)

    expect(result).toBe('INSERT INTO table columns VALUES values')
  })

  it('deve substituir os placeholders em um SELECT', () => {
    const query = 'SELECT :fields FROM :table'
    const params = { fields: '*', table: 'tableName' }

    const result = replace(query, params)

    expect(result).toBe('SELECT * FROM tableName')
  })

  it('deve substituir o placeholder do WHERE', () => {
    const query = 'SELECT :fields FROM :table WHERE :where'
    const params = { fields: '*', table: 'tableName', where: 'id = 1' }

    const result = replace(query, params)

    expect(result).toBe('SELECT * FROM tableName WHERE id = 1')
  })

  it('deve substituir o placeholder com um valor', () => {
    const query = 'SELECT * FROM tableName WHERE hora >= :date ORDER BY hora'
    const params = { date: '1000' }

    const result = replace(query, params)

    expect(result).toBe(
      'SELECT * FROM tableName WHERE hora >= 1000 ORDER BY hora'
    )
  })

  it('deve substituir o placeholder com um dado "escapado"', () => {
    const query = 'SELECT * FROM tableName WHERE hora >= :date ORDER BY hora'
    const params = { date: '"2019-01-24 12:34:21"' }

    const result = replace(query, params)

    expect(result).toBe(
      'SELECT * FROM tableName WHERE hora >= "2019-01-24 12:34:21" ORDER BY hora'
    )
  })
})
