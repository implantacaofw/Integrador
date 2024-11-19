/**
 * Mock to original module 'http'
 */
jest.mock('axios')
const axios = require('axios')

/**
 * Mock to original module 'yamls'
 */
jest.mock('yamljs')
const { load } = require('yamljs')
load.mockReturnValue({
  service: { name: 'fakename', token: 'faketoken' }
})

/**
 * Service to be tested.
 */
const { sendData } = require('../src/services/data-sender')

describe('[Service] Data Sender', () => {
  /**
   * - Should be called with url and data params.
   * - Should throw an error if api url is not given.
   * - Should throw an error if data is not given.
   * - Should...
   */

  beforeEach(() => {
    axios.mockReset()
  })

  it('deve ser uma função', () => {
    expect(typeof sendData).toBe('function')
  })

  it('deve ser chamado com uma url e parâmetros', async done => {
    const port = 80
    const apiUrl = 'http://fakeapi.com'
    const timeout = 1000
    load.mockReturnValue({
      service: { splitBy: 50 },
      api: { url: apiUrl, port, timeout }
    })

    const url = 'fakeurl'
    const data = {}

    await sendData(url, data)

    expect(axios.post).toHaveBeenCalledWith(`${apiUrl}:${port}/${url}`, data, {
      timeout
    })

    done()
  })

  it('deve disparar um erro se as configurações da API não forem definidas', async done => {
    load.mockReturnValue({ api: {} })

    await expect(sendData(undefined, undefined)).rejects.toThrow(
      'Você precisa configurar a url da API para envio dos dados.'
    )

    done()
  })

  it('deve disparar um erro se o endpoint para envio das informações não for definida', async done => {
    const apiUrl = 'http://fakeapi.com'
    load.mockReturnValue({
      api: { url: apiUrl }
    })

    const url = undefined
    const data = {}

    await expect(sendData(url, data)).rejects.toThrow(
      'Você deve fornecer uma url para envio das informações.'
    )

    done()
  })

  it('deve disparar um erro se não houver nenhum dado para envio', async done => {
    const apiUrl = 'http://fakeapi.com'
    load.mockReturnValue({
      api: { url: apiUrl }
    })

    const url = '/fakeurl'
    const data = undefined

    await expect(sendData(url, data)).rejects.toThrow(
      'Nenhum dado fornecido para envio.'
    )

    done()
  })

  it('deve tentar enviar os dados o número de vezes configurado quando a API não responder', async done => {
    const apiUrl = 'http://fakeapi.com'
    load.mockReturnValue({
      service: { splitBy: 50 },
      api: { url: apiUrl, timeout: 1000, timesToRetry: 3 }
    })
    axios.post = jest.fn(() => Promise.reject(new Error('Fake error!')))

    const url = '/fakeurl'
    const data = {}

    await expect(sendData(url, data)).rejects.toThrow()
    expect(axios.post).toBeCalledTimes(3)
    done()
  })
})
