import { RadonMarkup } from '../src/Markup'
import { Mir } from '../src/types'

describe.only('Markup', () => {
  it('mir2markup', () => {
    const drMir: Mir = {
      name: 'bitcoin',
      description: 'Request the bitcoin price from coindesk, blockchain.info, bitstamp',
      radRequest: {
        notBefore: 1669852800,
        retrieve: [
          {
            url: 'https://api.coindesk.com/v1/bpi/currentprice.json',
            script: [69, 116, [97, 'bpi'], 116, [97, 'VSD'], 116, [97, 'rate_float'], 114],
          },
        ],
        aggregate: [[87, 3]],
        tally: [[87, 3]],
      },
    }
    const markup = new RadonMarkup(drMir).cachedMarkup
    expect(markup).toStrictEqual({})
  })
})
