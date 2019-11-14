import { getEnumNames } from './utils'

import {
  Markup,
  Mir,
  MarkupScript,
  MarkupRequest,
  MirSource,
  GeneratedMarkupScript,
  MarkupSource,
  MirScript,
  MirOperator,
  MarkupOperator,
  OperatorInfo,
  MarkupSelect,
  MarkupType,
  MarkupHierarchicalType,
  OperatorCode,
  MirArgument,
  MarkupOption,
  TypeSystemValue,
  MarkupSelectedOption,
  MarkupInput,
  MirArgumentKind,
  FilterArgument,
  OutputType,
  Reducer,
  Filter,
  TypeSystemEntry,
  CacheRef,
} from './types'

import { Cache, operatorInfos, typeSystem } from './structures'

const filterArgumentOptions = generateFilterArgumentOptions()
const reducerArgumentOptions = generateReducerArgumentOptions()

// type CachedMarkupScript = Array<CacheRef>

type CachedMarkupSelect = {
  id: number
  scriptId: number
  markupType: MarkupType.Select
  hierarchicalType: MarkupHierarchicalType.Operator | MarkupHierarchicalType.Argument
  outputType: Array<OutputType> | OutputType
  selected: CacheRef
  options: Array<MarkupOption>
  label?: string
}
type CachedMarkupOperator = CachedMarkupSelect
type CachedMarkupScript = Array<CachedMarkupSelect>

export type CachedMarkupRequest = {
  notBefore: number
  retrieve: Array<CachedMarkupSource>
  aggregate: CachedMarkupScript
  tally: CachedMarkupScript
}

type CachedMarkupSource = {
  url: string
  script: CachedMarkupScript
}

type CachedMarkup = {
  name: string
  description: string
  radRequest: CachedMarkupRequest
}

export class RadonMarkup {
  private cache: Cache<Markup | MarkupSelectedOption>
  private cachedMarkup: CachedMarkup

  constructor(mir: Mir) {
    this.cache = new Cache()
    this.cachedMarkup = this.mir2markup(mir)
  }

  private wrapResultInCache(result: Markup | MarkupSelectedOption) {
    return this.cache.set(result)
  }

  public mir2markup(mir: Mir): CachedMarkup {
    const aggregateScript: CachedMarkupScript = this.generateMarkupScript(mir.radRequest.aggregate)
    const tallyScript: CachedMarkupScript = this.generateMarkupScript(mir.radRequest.tally)
    const radRequest: CachedMarkupRequest = {
      notBefore: mir.radRequest.notBefore,
      retrieve: mir.radRequest.retrieve.map((source: MirSource) => {
        let generatedMarkupScript: CachedMarkupScript = this.generateMarkupScript(source.script)
        return {
          url: source.url,
          script: generatedMarkupScript,
        } as CachedMarkupSource
      }),
      aggregate: aggregateScript,
      tally: tallyScript,
    }

    return {
      name: mir.name,
      description: mir.description,
      radRequest,
    } as CachedMarkup
  }

  public generateMarkupScript(script: MirScript): CachedMarkupScript {
    const markupScript: CachedMarkupScript = script.map((operator: MirOperator) => {
      return this.generateMarkupOperator(operator)
    })

    return markupScript
  }

  public generateMarkupOperator(operator: MirOperator): CachedMarkupOperator {
    const { code, args } = getMirOperatorInfo(operator)
    const operatorInfo: OperatorInfo = operatorInfos[code]
    const outputType = findOutputType(code)

    const markupOperator: CachedMarkupSelect = {
      id: 0,
      scriptId: 0,
      markupType: MarkupType.Select,
      hierarchicalType: MarkupHierarchicalType.Operator,
      outputType,
      selected: this.wrapResultInCache(this.generateSelectedOption(operatorInfo, code, args)),
      options: generateMarkupOptions(operatorInfo, code, args),
    }

    return markupOperator
  }

  public generateSelectedOption(
    operatorInfo: OperatorInfo,
    code: OperatorCode,
    args: Array<MirArgument> | null
  ): MarkupSelectedOption {
    const outputType = findOutputType(code)
    const markupSelectedOption: MarkupSelectedOption = {
      arguments: args ? this.generateOperatorArguments(operatorInfo, args) : [],
      hierarchicalType: MarkupHierarchicalType.SelectedOperatorOption,
      label: operatorInfo.name,
      markupType: MarkupType.Option,
      // TODO: Add support for pseudotypes
      outputType: outputType,
    }

    return markupSelectedOption
  }

  public generateOperatorArguments(
    operatorInfo: OperatorInfo,
    args: Array<MirArgument>
  ): Array<MarkupInput | MarkupSelect> {
    const operatorArguments: Array<MarkupInput | MarkupSelect> = args.map(
      (argument: MirArgument, index: number) => {
        let argumentInfo = operatorInfo.arguments[index]
        switch (argumentInfo.type) {
          // TODO: Add support for pseudotypes
          case MirArgumentKind.Array:
          case MirArgumentKind.Boolean:
          case MirArgumentKind.Bytes:
          case MirArgumentKind.Mapper:
          case MirArgumentKind.Passthrough:
          case MirArgumentKind.Result:
          case MirArgumentKind.Float:
          case MirArgumentKind.Inner:
          case MirArgumentKind.Integer:
          case MirArgumentKind.Map:
          case MirArgumentKind.String:
            return {
              hierarchicalType: MarkupHierarchicalType.Argument,
              id: 0,
              label: argumentInfo.name,
              markupType: MarkupType.Input,
              type: argumentInfo.type,
              value: argument,
            } as MarkupInput
          case MirArgumentKind.Filter:
            return {
              hierarchicalType: MarkupHierarchicalType.Argument,
              id: 0,
              markupType: MarkupType.Select,
              options: filterArgumentOptions,
              scriptId: 0,
              label: argumentInfo.name,
              selected: this.generateSelectedFilterArgument(argument as FilterArgument),
            } as MarkupSelect
          case MirArgumentKind.Reducer:
            return {
              hierarchicalType: MarkupHierarchicalType.Argument,
              id: 0,
              markupType: MarkupType.Select,
              options: reducerArgumentOptions,
              outputType: OutputType.Integer,
              scriptId: 0,
              label: argumentInfo.name,
              selected: this.generateSelectedReducerArgument(argument as Reducer),
            } as MarkupSelect
        }
      }
    )
    return operatorArguments
  }

  public generateSelectedFilterArgument(filterArgument: FilterArgument): MarkupSelectedOption {
    const filter: Filter = filterArgument[0]
    const argument = filterArgument[1]
    const selectedArgument: MarkupSelectedOption = {
      arguments: [
        {
          hierarchicalType: MarkupHierarchicalType.Argument,
          id: 0,
          label: 'by',
          markupType: MarkupType.Input,
          value: argument,
        } as MarkupInput,
      ],
      label: Filter[filter],
      hierarchicalType: MarkupHierarchicalType.SelectedOperatorOption,
      markupType: MarkupType.Option,
      outputType: OutputType.Bytes,
    }
    return selectedArgument
  }

  public generateSelectedReducerArgument(reducer: Reducer): MarkupSelectedOption {
    const selectedArgument: MarkupSelectedOption = {
      arguments: [],
      label: Reducer[reducer],
      hierarchicalType: MarkupHierarchicalType.SelectedOperatorOption,
      markupType: MarkupType.Option,
      outputType: OutputType.Bytes,
    }
    return selectedArgument
  }
}

function findOutputType(code: OperatorCode): OutputType | Array<OutputType> {
  const entry: TypeSystemEntry = Object.entries(typeSystem).find(entry => {
    return Object.values(entry[1]).find(x => x[0] === code)
  }) as TypeSystemEntry
  const operatorEntry: [OperatorCode, OutputType[]] = Object.values(entry[1]).find(
    x => x[0] === code
  ) as [OperatorCode, OutputType[]]
  const outputType: Array<OutputType> = operatorEntry[1] as Array<OutputType>
  return outputType.length > 1 ? outputType : outputType[0]
}

function getMirOperatorInfo(
  operator: MirOperator
): { code: OperatorCode; args: Array<MirArgument> | null } {
  return Array.isArray(operator)
    ? {
        code: operator[0] as OperatorCode,
        args: operator.slice(1) as Array<MirArgument>,
      }
    : {
        code: operator as OperatorCode,
        args: null,
      }
}

// TODO: Call this function just at the beginning
function generateFilterArgumentOptions(): Array<MarkupOption> {
  const markupOptions: Array<MarkupOption> = getEnumNames(Filter).map(name => {
    return {
      label: name,
      hierarchicalType: MarkupHierarchicalType.OperatorOption,
      markupType: MarkupType.Option,
      // TODO: Add support for pseudotypes
      outputType: OutputType.Bytes,
    }
  })
  return markupOptions
}

// TODO: Call this function just at the beginning
function generateReducerArgumentOptions(): Array<MarkupOption> {
  const markupOptions: Array<MarkupOption> = getEnumNames(Reducer).map(name => {
    return {
      label: name,
      hierarchicalType: MarkupHierarchicalType.OperatorOption,
      markupType: MarkupType.Option,
      outputType: OutputType.Bytes,
    }
  })
  return markupOptions
}

function generateMarkupOptions(
  operatorInfo: OperatorInfo,
  _code: OperatorCode,
  _args: Array<MirArgument> | null
): Array<MarkupOption> {
  const markupOptions: Array<MarkupOption> = Object.entries(typeSystem[operatorInfo.type]).map(
    (x: TypeSystemValue) => {
      return {
        hierarchicalType: MarkupHierarchicalType.OperatorOption,
        label: x[0],
        markupType: MarkupType.Option,
        // TODO: Add support for Pseudotypes
        outputType: x[1][1].length > 1 ? x[1][1] : x[1][1][0],
      }
    }
  )

  return markupOptions
}
