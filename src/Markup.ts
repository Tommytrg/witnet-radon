import { getEnumNames } from './utils'

import {
  Markup,
  Mir,
  MirSource,
  MirScript,
  MirOperator,
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
  MarkupRequest,
  MarkupSource,
  MarkupScript,
  MarkupOperator,
  MarkupArgument,
} from './types'

import { Cache, operatorInfos, typeSystem } from './structures'

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
// type CachedMarkupScript = Array<CachedMarkupSelect>
type CachedMarkupScript = Array<CacheRef>

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

type CachedMarkupSelectedOption = {
  arguments: Array<CacheRef> | []
  hierarchicalType: MarkupHierarchicalType.SelectedOperatorOption
  label: string
  markupType: MarkupType.Option
  outputType: OutputType | Array<OutputType>
}

type CachedArgument = MarkupInput | CachedMarkupSelect

export class RadonMarkup {
  private cache: Cache<CachedMarkupSelectedOption | Markup | CachedArgument>
  private cachedMarkup: CachedMarkup

  private filterArgumentOptions = this.generateFilterArgumentOptions()
  private reducerArgumentOptions = this.generateReducerArgumentOptions()

  constructor(mir?: Mir) {
    const defaultRequest = {
      description: '',
      name: '',
      radRequest: {
        notBefore: 0,
        retrieve: [
          {
            script: [],
            url: '',
          },
        ],
        aggregate: [],
        tally: [],
      },
    }

    this.cache = new Cache()
    this.cachedMarkup = mir ? this.mir2markup(mir) : defaultRequest
  }

  public wrapResultInCache(result: Markup | CachedMarkupSelect | CachedMarkupSelectedOption) {
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
    this.cachedMarkup = {
      name: mir.name,
      description: mir.description,
      radRequest,
    } as CachedMarkup

    return this.cachedMarkup
  }

  public getMarkup(): Markup {
    const cachedRadRequest = this.cachedMarkup.radRequest

    const radRequest: MarkupRequest = {
      notBefore: cachedRadRequest.notBefore,
      retrieve: cachedRadRequest.aggregate.map(source => this.unwrapSource(source)),
      aggregate: this.unwrapScript(cachedRadRequest.aggregate),
      tally: this.unwrapScript(cachedRadRequest.tally),
    }

    return {
      description: this.cachedMarkup.description,
      name: this.cachedMarkup.name,
      radRequest,
    }
  }

  // tested
  public generateMarkupScript(script: MirScript): CachedMarkupScript {
    const markupScript: CachedMarkupScript = script.map((operator: MirOperator) => {
      return this.wrapResultInCache(this.generateMarkupOperator(operator))
    })

    return markupScript
  }

  public generateMarkupOperator(operator: MirOperator): CachedMarkupOperator {
    const { code, args } = this.getMirOperatorInfo(operator)
    const operatorInfo: OperatorInfo = operatorInfos[code]
    const outputType = this.findOutputType(code)

    const markupOperator: CachedMarkupSelect = {
      id: 0,
      scriptId: 0,
      markupType: MarkupType.Select,
      hierarchicalType: MarkupHierarchicalType.Operator,
      outputType,
      selected: this.wrapResultInCache(this.generateSelectedOption(operatorInfo, code, args)),
      options: this.generateMarkupOptions(operatorInfo, code, args),
    }

    return markupOperator
  }

  public generateSelectedOption(
    operatorInfo: OperatorInfo,
    code: OperatorCode,
    args: Array<MirArgument> | null
  ): CachedMarkupSelectedOption {
    const outputType = this.findOutputType(code)
    const markupSelectedOption: CachedMarkupSelectedOption = {
      arguments: args
        ? this.generateOperatorArguments(operatorInfo, args).map(x => this.cache.set(x))
        : [],
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
  ): Array<CachedArgument> {
    const operatorArguments: Array<CachedArgument> = args.map(
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
              options: this.filterArgumentOptions,
              scriptId: 0,
              label: argumentInfo.name,
              selected: this.wrapResultInCache(
                this.generateSelectedFilterArgument(argument as FilterArgument)
              ),
            } as CachedMarkupSelect
          case MirArgumentKind.Reducer:
            return {
              hierarchicalType: MarkupHierarchicalType.Argument,
              id: 0,
              markupType: MarkupType.Select,
              options: this.reducerArgumentOptions,
              outputType: OutputType.Integer,
              scriptId: 0,
              label: argumentInfo.name,
              selected: this.wrapResultInCache(
                this.generateSelectedReducerArgument(argument as Reducer)
              ),
            } as CachedMarkupSelect
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

  // TODO: Remove unknown to have a stronger type
  public unwrapSource(source: CacheRef): MarkupSource {
    const cachedMarkupSource: CachedMarkupSource = (this.cache.get(
      source.id
    ) as unknown) as CachedMarkupSource
    const markupSource: MarkupSource = {
      url: cachedMarkupSource.url,
      script: this.unwrapScript(cachedMarkupSource.script),
    }

    return markupSource
  }

  public unwrapScript(script: Array<CacheRef>): MarkupScript {
    const markupScript: MarkupScript = script.map(operatorRef => {
      const cachedOperator: CachedMarkupOperator = (this.cache.get(
        operatorRef.id
      ) as unknown) as CachedMarkupOperator
      const operator: MarkupOperator = this.unwrapOperator(cachedOperator, operatorRef.id)

      return operator
    })

    return markupScript
  }

  public unwrapOperator(operator: CachedMarkupOperator, id: number): MarkupOperator {
    const markup: MarkupOperator = {
      hierarchicalType: operator.hierarchicalType,
      id: id,
      label: operator.label,
      markupType: operator.markupType,
      options: operator.options,
      outputType: operator.outputType,
      scriptId: operator.scriptId,
      selected: this.unwrapSelectedOption(operator.selected),
    }
    return markup
  }

  public unwrapSelectedOption(selectedOption: CacheRef): MarkupSelectedOption {
    const cachedSelectedOption: CachedMarkupSelectedOption = this.cache.get(
      selectedOption.id
    ) as CachedMarkupSelectedOption

    const markup: MarkupSelectedOption = {
      arguments: cachedSelectedOption.arguments.length
        ? (cachedSelectedOption.arguments as Array<CacheRef>).map((argument: CacheRef) => {
            return this.unwrapArgument(argument)
          })
        : [],
      hierarchicalType: cachedSelectedOption.hierarchicalType,
      label: cachedSelectedOption.hierarchicalType,
      markupType: cachedSelectedOption.markupType,
      outputType: cachedSelectedOption.outputType,
    }

    return markup
  }

  public unwrapArgument(arg: CacheRef): MarkupArgument {
    const cachedArgument = (this.cache.get(arg.id) as unknown) as (CachedArgument)

    switch (cachedArgument.markupType) {
      case MarkupType.Input:
        return {
          hierarchicalType: cachedArgument.hierarchicalType,
          id: arg.id,
          label: cachedArgument.label,
          markupType: cachedArgument.markupType,
          value: cachedArgument.value,
        } as MarkupInput
      case MarkupType.Select:
        return {
          hierarchicalType: cachedArgument.hierarchicalType,
          id: arg.id,
          label: cachedArgument.label,
          markupType: cachedArgument.markupType,
          options: cachedArgument.options,
          outputType: cachedArgument.outputType,
          scriptId: cachedArgument.scriptId,
          selected: this.unwrapSelectedOption(cachedArgument.selected),
        } as MarkupSelect
    }
  }

  public findOutputType(code: OperatorCode): OutputType | Array<OutputType> {
    const entry: TypeSystemEntry = Object.entries(typeSystem).find(entry => {
      return Object.values(entry[1]).find(x => x[0] === code)
    }) as TypeSystemEntry
    const operatorEntry: [OperatorCode, OutputType[]] = Object.values(entry[1]).find(
      x => x[0] === code
    ) as [OperatorCode, OutputType[]]
    const outputType: Array<OutputType> = operatorEntry[1] as Array<OutputType>
    return outputType.length > 1 ? outputType : outputType[0]
  }

  public getMirOperatorInfo(
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
  public generateFilterArgumentOptions(): Array<MarkupOption> {
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
  public generateReducerArgumentOptions(): Array<MarkupOption> {
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

  public generateMarkupOptions(
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
}
