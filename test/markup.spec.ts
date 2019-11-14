import { RadonMarkup } from '../src/Markup'
import { MirScript, OutputType } from '../src/types'
import { operatorInfos } from '../src/structures'

describe.only('Markup', () => {
  //   it('mir2markup', () => {

  //     const drMir: Mir = {
  //       name: 'name',
  //       description: 'description',
  //       radRequest: {
  //         notBefore: 1669852800,
  //         retrieve: [
  //           {
  //             url: 'https://api.coindesk.com/v1/bpi/currentprice.json',
  //             script: [69, 116, [97, 'bpi'], 116, [97, 'VSD'], 116, [97, 'rate_float'], 114],
  //           },
  //         ],
  //         aggregate: [[87, 3]],
  //         tally: [[87, 3]],
  //       },
  //     }
  //     const markup = new RadonMarkup(drMir).cachedMarkup
  //     expect(markup).toStrictEqual({})
  //   })

  it('generateMarkupScript', () => {
    const script: MirScript = [69, 116, [97, 'bpi'], 116, [97, 'VSD'], 116, [97, 'rate_float'], 114]
    const radonMarkup = new RadonMarkup()

    const generateMarkupOperator = (RadonMarkup.prototype.generateMarkupOperator = jest
      .fn()
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(2)
      .mockReturnValueOnce(3)
      .mockReturnValueOnce(4)
      .mockReturnValueOnce(5)
      .mockReturnValueOnce(6)
      .mockReturnValueOnce(7)
      .mockReturnValueOnce(8))
    const wrapResultInCache = (RadonMarkup.prototype.wrapResultInCache = jest.fn())
    radonMarkup.generateMarkupScript(script)

    expect(generateMarkupOperator).toHaveBeenNthCalledWith(1, script[0])
    expect(generateMarkupOperator).toHaveBeenNthCalledWith(2, script[1])
    expect(generateMarkupOperator).toHaveBeenNthCalledWith(3, script[2])
    expect(generateMarkupOperator).toHaveBeenNthCalledWith(4, script[3])
    expect(generateMarkupOperator).toHaveBeenNthCalledWith(5, script[4])
    expect(generateMarkupOperator).toHaveBeenNthCalledWith(6, script[5])
    expect(generateMarkupOperator).toHaveBeenNthCalledWith(7, script[6])
    expect(generateMarkupOperator).toHaveBeenNthCalledWith(8, script[7])

    expect(wrapResultInCache).toHaveBeenNthCalledWith(1, 1)
    expect(wrapResultInCache).toHaveBeenNthCalledWith(2, 2)
    expect(wrapResultInCache).toHaveBeenNthCalledWith(3, 3)
    expect(wrapResultInCache).toHaveBeenNthCalledWith(4, 4)
    expect(wrapResultInCache).toHaveBeenNthCalledWith(5, 5)
    expect(wrapResultInCache).toHaveBeenNthCalledWith(6, 6)
    expect(wrapResultInCache).toHaveBeenNthCalledWith(7, 7)
    expect(wrapResultInCache).toHaveBeenNthCalledWith(8, 8)
  })

  describe.only('expect generateMarkupOperator returns the correct markup operator', () => {
    it.only('without arguments', () => {
      const radonMarkup = new RadonMarkup()
      const operatorCode = 0x11
      const args: [] = []
      const operator = operatorCode

      const wrapResultInCache = (RadonMarkup.prototype.wrapResultInCache = jest.fn())
      const generateSelectedOption = (RadonMarkup.prototype.generateSelectedOption = jest.fn())
      const generateMarkupOptions = (RadonMarkup.prototype.generateMarkupOptions = jest.fn())

      const getMirOperatorInfo = (RadonMarkup.prototype.getMirOperatorInfo = jest.fn(() => ({
        code: operatorCode,
        args,
      })))

      const findOutputType = (RadonMarkup.prototype.findOutputType = jest.fn(
        () => OutputType.Boolean
      ))

      radonMarkup.generateMarkupOperator(operator)
      expect(getMirOperatorInfo).toHaveBeenCalledWith(operator)
      expect(findOutputType).toHaveBeenCalledWith(operator)
      expect(generateSelectedOption).toHaveBeenCalledWith(
        operatorInfos[operatorCode],
        operatorCode,
        args
      )
      expect(generateMarkupOptions).toHaveBeenCalledWith(
        operatorInfos[operatorCode],
        operatorCode,
        args
      )
      expect(wrapResultInCache).toBeCalled()
    })

    // it('with 1 argument', () => {
    //   const markupOperator = radonMarkup.generateMarkupOperator([0x23, 10])

    //   const expected = {
    //     hierarchicalType: 'operator',
    //     id: 0,
    //     markupType: 'select',
    //     options: [
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'absolute',
    //         markupType: 'option',
    //         outputType: 'integer',
    //       },
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'asBytes',
    //         markupType: 'option',
    //         outputType: 'bytes',
    //       },
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'asFloat',
    //         markupType: 'option',
    //         outputType: 'float',
    //       },
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'asString',
    //         markupType: 'option',
    //         outputType: 'string',
    //       },
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'greaterThan',
    //         markupType: 'option',
    //         outputType: 'boolean',
    //       },
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'lessThan',
    //         markupType: 'option',
    //         outputType: 'boolean',
    //       },
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'match',
    //         markupType: 'option',
    //         outputType: 'argument',
    //       },
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'modulo',
    //         markupType: 'option',
    //         outputType: 'integer',
    //       },
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'multiply',
    //         markupType: 'option',
    //         outputType: 'integer',
    //       },
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'negate',
    //         markupType: 'option',
    //         outputType: 'integer',
    //       },
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'power',
    //         markupType: 'option',
    //         outputType: 'integer',
    //       },
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'reciprocal',
    //         markupType: 'option',
    //         outputType: 'float',
    //       },
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'sum',
    //         markupType: 'option',
    //         outputType: 'integer',
    //       },
    //     ],
    //     outputType: 'string',
    //     scriptId: 0,
    //     selected: {
    //       arguments: [
    //         {
    //           hierarchicalType: 'argument',
    //           id: 0,
    //           type: 6,
    //           label: 'base',
    //           markupType: 'input',
    //           value: 10,
    //         },
    //       ],
    //       hierarchicalType: 'selectedOperatorOption',
    //       label: 'asString',
    //       markupType: 'option',
    //       outputType: 'string',
    //     },
    //   }
    //   expect(markupOperator).toStrictEqual(expected)
    // })

    // it('with 2 argument', () => {
    //   const markupOperator = generateMarkupOperator([0x10, 'a', 'b'])
    //   const expected = {
    //     hierarchicalType: 'operator',
    //     id: 0,
    //     markupType: 'select',
    //     options: [
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'asString',
    //         markupType: 'option',
    //         outputType: 'string',
    //       },
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'match',
    //         markupType: 'option',
    //         outputType: 'argument',
    //       },
    //       {
    //         hierarchicalType: 'operatorOption',
    //         label: 'negate',
    //         markupType: 'option',
    //         outputType: 'boolean',
    //       },
    //     ],
    //     outputType: 'argument',
    //     scriptId: 0,
    //     selected: {
    //       arguments: [
    //         {
    //           hierarchicalType: 'argument',
    //           id: 0,
    //           label: 'categories',
    //           type: 7,
    //           markupType: 'input',
    //           value: 'a',
    //         },
    //         {
    //           hierarchicalType: 'argument',
    //           id: 0,
    //           label: 'default',
    //           type: 5,
    //           markupType: 'input',
    //           value: 'b',
    //         },
    //       ],
    //       hierarchicalType: 'selectedOperatorOption',
    //       label: 'match',
    //       markupType: 'option',
    //       outputType: 'argument',
    //     },
    //   }
    //   expect(markupOperator).toStrictEqual(expected)
    // })
  })
})
