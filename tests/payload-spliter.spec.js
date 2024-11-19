const splitPayload = require('../src/services/payload-spliter')

describe('[Service] Payload Spliter:', () => {
  /**
   * - Should split the payload
   * - Should split the payload just if the payload size is greater than 10000
   */

  const givenPayload = total => {
    const payload = []

    for (let i = 0; i < total; i++) {
      payload.push(i)
    }

    return payload
  }

  it('deve o número de vezes para "esplitar" ser 4000', () => {
    const value = 200000
    const payload = givenPayload(value)

    const splittedPayload = splitPayload(payload, 50)

    expect(splittedPayload.length).toBe(4000)
  })

  it('deve o número de vezes para "esplitar" ser 402', () => {
    const value = 20100
    const payload = givenPayload(value)

    const splittedPayload = splitPayload(payload, 50)

    expect(splittedPayload.length).toBe(402)
  })

  it('deve o número de vezes para "esplitar" ser 200 se o payload for menor que 10000', () => {
    const value = 9999
    const payload = givenPayload(value)

    const splittedPayload = splitPayload(payload, 50)

    expect(splittedPayload.length).toBe(200)
  })
})
