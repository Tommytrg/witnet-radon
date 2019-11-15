import { CachedArgument } from '../src/Markup'
import { MirScript, OutputType, OperatorCode, MirOperator } from '../src/types'
import { operatorInfos } from '../src/structures'

describe.only('Markup', () => {
  it('generateMarkupScript', () => {
    const { RadonMarkup } = require('../src/Markup')
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

  describe('expect generateMarkupOperator returns the correct markup operator', () => {
    it('without arguments', () => {
      const { RadonMarkup } = require('../src/Markup')

      const radonMarkup = new RadonMarkup()
      const operatorCode = 0x11
      const args: [] = []
      const operator = operatorCode

      const wrapResultInCache = (RadonMarkup.prototype.wrapResultInCache = jest.fn(() => ({
        id: 1,
      })))
      const generateSelectedOption = (RadonMarkup.prototype.generateSelectedOption = jest.fn())
      const generateMarkupOptions = (RadonMarkup.prototype.generateMarkupOptions = jest.fn(
        () => []
      ))

      const getMirOperatorInfo = (RadonMarkup.prototype.getMirOperatorInfo = jest.fn(() => ({
        code: operatorCode,
        args,
      })))

      const findOutputType = (RadonMarkup.prototype.findOutputType = jest.fn(
        () => OutputType.Boolean
      ))

      const result = radonMarkup.generateMarkupOperator(operator)
      expect(getMirOperatorInfo).toHaveBeenCalledWith(operator)
      expect(findOutputType).toHaveBeenCalledWith(operatorCode)
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
      expect(result).toStrictEqual({
        hierarchicalType: 'operator',
        id: 0,
        markupType: 'select',
        options: [],
        outputType: 'boolean',
        scriptId: 0,
        selected: { id: 1 },
      })
    })

    it('with 1 argument', () => {
      const { RadonMarkup } = require('../src/Markup')

      const radonMarkup = new RadonMarkup()
      const operator = [0x23, 10] as MirOperator

      const args = [10]
      const operatorCode = 0x23 as OperatorCode

      const wrapResultInCache = (RadonMarkup.prototype.wrapResultInCache = jest.fn(() => ({
        id: 1,
      })))
      const generateSelectedOption = (RadonMarkup.prototype.generateSelectedOption = jest.fn())
      const generateMarkupOptions = (RadonMarkup.prototype.generateMarkupOptions = jest.fn(
        () => []
      ))

      const getMirOperatorInfo = (RadonMarkup.prototype.getMirOperatorInfo = jest.fn(() => ({
        code: operatorCode,
        args,
      })))

      const findOutputType = (RadonMarkup.prototype.findOutputType = jest.fn(
        () => OutputType.Integer
      ))

      const result = radonMarkup.generateMarkupOperator(operator)
      expect(getMirOperatorInfo).toHaveBeenCalledWith(operator)
      expect(findOutputType).toHaveBeenCalledWith(operatorCode)
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

      expect(result).toStrictEqual({
        hierarchicalType: 'operator',
        id: 0,
        markupType: 'select',
        options: [],
        outputType: 'integer',
        scriptId: 0,
        selected: { id: 1 },
      })
    })
  })

  describe('generateSelectedOption', () => {
    it('without arguments', () => {
      const { RadonMarkup } = require('../src/Markup')

      const radonMarkup = new RadonMarkup()
      const operatorCode = 0x21 as OperatorCode
      const args: [] = []
      const operatorInfo = operatorInfos[operatorCode]

      const findOutputType = (RadonMarkup.prototype.findOutputType = jest.fn(
        () => OutputType.Integer
      ))

      const result = radonMarkup.generateSelectedOption(operatorInfo, operatorCode, args)
      expect(findOutputType).toHaveBeenCalledWith(operatorCode)
      expect(result).toStrictEqual({
        arguments: [],
        hierarchicalType: 'selectedOperatorOption',
        label: 'asBytes',
        markupType: 'option',
        outputType: 'integer',
      })
    })

    it('with 1 argument', () => {
      const { RadonMarkup } = require('../src/Markup')

      const radonMarkup = new RadonMarkup()
      const operatorCode = 0x23 as OperatorCode
      const args = [10]
      const operatorInfo = operatorInfos[operatorCode]

      const findOutputType = (RadonMarkup.prototype.findOutputType = jest.fn(
        () => OutputType.Integer
      ))

      const argument = {
        id: 1,
      } as CachedArgument

      const generateOperatorArguments = (RadonMarkup.prototype.generateOperatorArguments = jest.fn(
        () => [argument]
      ))

      const result = radonMarkup.generateSelectedOption(operatorInfo, operatorCode, args)
      expect(generateOperatorArguments).toHaveBeenCalledWith(operatorInfo, args)
      expect(findOutputType).toHaveBeenCalledWith(operatorCode)
      expect(result).toStrictEqual({
        arguments: [{ id: 1 }],
        hierarchicalType: 'selectedOperatorOption',
        label: 'asString',
        markupType: 'option',
        outputType: 'integer',
      })
    })
  })

  it.only('generateFilterArgument', () => {
    const { RadonMarkup } = require('../src/Markup')

    const radonMarkup = new RadonMarkup()
    const filterArgs = [0x00, 1]

    const wrapResultInCache = (RadonMarkup.prototype.wrapResultInCache = jest.fn(() => ({ id: 1 })))
    const generateSelectedFilterArgumentResult = 'generateSelectedFilterArgumentResult'
    const generateSelectedFilterArgument = (RadonMarkup.prototype.generateSelectedFilterArgument = jest.fn(
      () => generateSelectedFilterArgumentResult
    ))
    const result = radonMarkup.generateFilterArgument('function', filterArgs)
    expect(generateSelectedFilterArgument).toBeCalledWith(filterArgs)
    expect(wrapResultInCache).toBeCalledWith(generateSelectedFilterArgumentResult)
    expect(result).toStrictEqual({
      hierarchicalType: 'argument',
      id: 0,
      label: 'function',
      markupType: 'select',
      options: [
        {
          hierarchicalType: 'operatorOption',
          label: 'greaterThan',
          markupType: 'option',
          outputType: 'bytes',
        },
        {
          hierarchicalType: 'operatorOption',
          label: 'LessThan',
          markupType: 'option',
          outputType: 'bytes',
        },
        {
          hierarchicalType: 'operatorOption',
          label: 'equals',
          markupType: 'option',
          outputType: 'bytes',
        },
        {
          hierarchicalType: 'operatorOption',
          label: 'deviationAbsolute',
          markupType: 'option',
          outputType: 'bytes',
        },
        {
          hierarchicalType: 'operatorOption',
          label: 'deviationRelative',
          markupType: 'option',
          outputType: 'bytes',
        },
        {
          hierarchicalType: 'operatorOption',
          label: 'deviationStandard',
          markupType: 'option',
          outputType: 'bytes',
        },
        {
          hierarchicalType: 'operatorOption',
          label: 'top',
          markupType: 'option',
          outputType: 'bytes',
        },
        {
          hierarchicalType: 'operatorOption',
          label: 'bottom',
          markupType: 'option',
          outputType: 'bytes',
        },
        {
          hierarchicalType: 'operatorOption',
          label: 'lessOrEqualThan',
          markupType: 'option',
          outputType: 'bytes',
        },
        {
          hierarchicalType: 'operatorOption',
          label: 'greaterOrEqualThan',
          markupType: 'option',
          outputType: 'bytes',
        },
        {
          hierarchicalType: 'operatorOption',
          label: 'notEquals',
          markupType: 'option',
          outputType: 'bytes',
        },
        {
          hierarchicalType: 'operatorOption',
          label: 'notDeviationAbsolute',
          markupType: 'option',
          outputType: 'bytes',
        },
        {
          hierarchicalType: 'operatorOption',
          label: 'notDeviationRelative',
          markupType: 'option',
          outputType: 'bytes',
        },
        {
          hierarchicalType: 'operatorOption',
          label: 'notDeviationStandard',
          markupType: 'option',
          outputType: 'bytes',
        },
        {
          hierarchicalType: 'operatorOption',
          label: 'notTop',
          markupType: 'option',
          outputType: 'bytes',
        },
        {
          hierarchicalType: 'operatorOption',
          label: 'notBottom',
          markupType: 'option',
          outputType: 'bytes',
        },
      ],
      scriptId: 0,
      selected: {
        id: 1,
      },
    })
  })
})
