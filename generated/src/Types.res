//*************
//***ENTITIES**
//*************
@genType.as("Id")
type id = string

@genType
type contractRegistrations = {
  // TODO: only add contracts we've registered for the event in the config
  addMarket: (Address.t) => unit,
  addRegistry: (Address.t) => unit,
}

@genType
type entityLoaderContext<'entity, 'indexedFieldOperations> = {
  get: id => promise<option<'entity>>,
  getWhere: 'indexedFieldOperations,
}

@genType
type loaderContext = {
  log: Logs.userLogger,
  @as("ActiveBuyOrder") activeBuyOrder: entityLoaderContext<Entities.ActiveBuyOrder.t, Entities.ActiveBuyOrder.indexedFieldOperations>,
  @as("ActiveSellOrder") activeSellOrder: entityLoaderContext<Entities.ActiveSellOrder.t, Entities.ActiveSellOrder.indexedFieldOperations>,
  @as("Balance") balance: entityLoaderContext<Entities.Balance.t, Entities.Balance.indexedFieldOperations>,
  @as("CancelOrderEvent") cancelOrderEvent: entityLoaderContext<Entities.CancelOrderEvent.t, Entities.CancelOrderEvent.indexedFieldOperations>,
  @as("DepositEvent") depositEvent: entityLoaderContext<Entities.DepositEvent.t, Entities.DepositEvent.indexedFieldOperations>,
  @as("DepositForEvent") depositForEvent: entityLoaderContext<Entities.DepositForEvent.t, Entities.DepositForEvent.indexedFieldOperations>,
  @as("MarketRegisterEvent") marketRegisterEvent: entityLoaderContext<Entities.MarketRegisterEvent.t, Entities.MarketRegisterEvent.indexedFieldOperations>,
  @as("OpenOrderEvent") openOrderEvent: entityLoaderContext<Entities.OpenOrderEvent.t, Entities.OpenOrderEvent.indexedFieldOperations>,
  @as("Order") order: entityLoaderContext<Entities.Order.t, Entities.Order.indexedFieldOperations>,
  @as("TradeOrderEvent") tradeOrderEvent: entityLoaderContext<Entities.TradeOrderEvent.t, Entities.TradeOrderEvent.indexedFieldOperations>,
  @as("WithdrawEvent") withdrawEvent: entityLoaderContext<Entities.WithdrawEvent.t, Entities.WithdrawEvent.indexedFieldOperations>,
  @as("WithdrawToMarketEvent") withdrawToMarketEvent: entityLoaderContext<Entities.WithdrawToMarketEvent.t, Entities.WithdrawToMarketEvent.indexedFieldOperations>,
}

@genType
type entityHandlerContext<'entity> = {
  get: id => promise<option<'entity>>,
  set: 'entity => unit,
  deleteUnsafe: id => unit,
}


@genType
type handlerContext = {
  log: Logs.userLogger,
  @as("ActiveBuyOrder") activeBuyOrder: entityHandlerContext<Entities.ActiveBuyOrder.t>,
  @as("ActiveSellOrder") activeSellOrder: entityHandlerContext<Entities.ActiveSellOrder.t>,
  @as("Balance") balance: entityHandlerContext<Entities.Balance.t>,
  @as("CancelOrderEvent") cancelOrderEvent: entityHandlerContext<Entities.CancelOrderEvent.t>,
  @as("DepositEvent") depositEvent: entityHandlerContext<Entities.DepositEvent.t>,
  @as("DepositForEvent") depositForEvent: entityHandlerContext<Entities.DepositForEvent.t>,
  @as("MarketRegisterEvent") marketRegisterEvent: entityHandlerContext<Entities.MarketRegisterEvent.t>,
  @as("OpenOrderEvent") openOrderEvent: entityHandlerContext<Entities.OpenOrderEvent.t>,
  @as("Order") order: entityHandlerContext<Entities.Order.t>,
  @as("TradeOrderEvent") tradeOrderEvent: entityHandlerContext<Entities.TradeOrderEvent.t>,
  @as("WithdrawEvent") withdrawEvent: entityHandlerContext<Entities.WithdrawEvent.t>,
  @as("WithdrawToMarketEvent") withdrawToMarketEvent: entityHandlerContext<Entities.WithdrawToMarketEvent.t>,
}

//Re-exporting types for backwards compatability
@genType.as("ActiveBuyOrder")
type activeBuyOrder = Entities.ActiveBuyOrder.t
@genType.as("ActiveSellOrder")
type activeSellOrder = Entities.ActiveSellOrder.t
@genType.as("Balance")
type balance = Entities.Balance.t
@genType.as("CancelOrderEvent")
type cancelOrderEvent = Entities.CancelOrderEvent.t
@genType.as("DepositEvent")
type depositEvent = Entities.DepositEvent.t
@genType.as("DepositForEvent")
type depositForEvent = Entities.DepositForEvent.t
@genType.as("MarketRegisterEvent")
type marketRegisterEvent = Entities.MarketRegisterEvent.t
@genType.as("OpenOrderEvent")
type openOrderEvent = Entities.OpenOrderEvent.t
@genType.as("Order")
type order = Entities.Order.t
@genType.as("TradeOrderEvent")
type tradeOrderEvent = Entities.TradeOrderEvent.t
@genType.as("WithdrawEvent")
type withdrawEvent = Entities.WithdrawEvent.t
@genType.as("WithdrawToMarketEvent")
type withdrawToMarketEvent = Entities.WithdrawToMarketEvent.t

type eventIdentifier = {
  chainId: int,
  blockTimestamp: int,
  blockNumber: int,
  logIndex: int,
}

type entityUpdateAction<'entityType> =
  | Set('entityType)
  | Delete

type entityUpdate<'entityType> = {
  eventIdentifier: eventIdentifier,
  shouldSaveHistory: bool,
  entityId: id,
  entityUpdateAction: entityUpdateAction<'entityType>,
}

let mkEntityUpdate = (~shouldSaveHistory=true, ~eventIdentifier, ~entityId, entityUpdateAction) => {
  entityId,
  shouldSaveHistory,
  eventIdentifier,
  entityUpdateAction,
}

type entityValueAtStartOfBatch<'entityType> =
  | NotSet // The entity isn't in the DB yet
  | AlreadySet('entityType)

type existingValueInDb<'entityType> =
  | Retrieved(entityValueAtStartOfBatch<'entityType>)
  // NOTE: We use an postgres function solve the issue of this entities previous value not being known.
  | Unknown

type updatedValue<'entityType> = {
  // Initial value within a batch
  initial: existingValueInDb<'entityType>,
  latest: entityUpdate<'entityType>,
  history: array<entityUpdate<'entityType>>,
}
@genType
type inMemoryStoreRowEntity<'entityType> =
  | Updated(updatedValue<'entityType>)
  | InitialReadFromDb(entityValueAtStartOfBatch<'entityType>) // This means there is no change from the db.

//*************
//**CONTRACTS**
//*************

module Log = {
  type t = {
    address: Address.t,
    data: string,
    topics: array<Ethers.EventFilter.topic>,
    logIndex: int,
  }

  let fieldNames = ["address", "data", "topics", "logIndex"]
}

module Transaction = {
  @genType
  type t = {id: string}

  let schema = S.object((s): t => {id: s.field("id", S.string)})
}

module Block = {
  @genType
  type t = {id: string, height: int, time: int}

  type rawEventFields = {id: string, height: int, time: int}

  let schema = S.object((s): t => {id: s.field("id", S.string), height: s.field("height", GqlDbCustomTypes.Int.schema), time: s.field("time", GqlDbCustomTypes.Int.schema)})

  let rawEventSchema = S.object((s): rawEventFields => {id: s.field("id", S.string), height: s.field("height", GqlDbCustomTypes.Int.schema), time: s.field("time", GqlDbCustomTypes.Int.schema)})


  @get
  external getNumber: t => int = "height"

  @get
  external getTimestamp: t => int = "time"
 
  @get
  external getId: t => string = "id"
}

@genType.as("EventLog")
type eventLog<'a> = {
  params: 'a,
  chainId: int,
  srcAddress: Address.t,
  logIndex: int,
  transaction: Transaction.t,
  block: Block.t,
}

module SingleOrMultiple: {
  @genType.import(("./bindings/OpaqueTypes", "SingleOrMultiple"))
  type t<'a>
  let normalizeOrThrow: (t<'a>, ~nestedArrayDepth: int=?) => array<'a>
  let single: 'a => t<'a>
  let multiple: array<'a> => t<'a>
} = {
  type t<'a> = Js.Json.t

  external single: 'a => t<'a> = "%identity"
  external multiple: array<'a> => t<'a> = "%identity"
  external castMultiple: t<'a> => array<'a> = "%identity"
  external castSingle: t<'a> => 'a = "%identity"

  exception AmbiguousEmptyNestedArray

  let rec isMultiple = (t: t<'a>, ~nestedArrayDepth): bool =>
    switch t->Js.Json.decodeArray {
    | None => false
    | Some(_arr) if nestedArrayDepth == 0 => true
    | Some([]) if nestedArrayDepth > 0 =>
      AmbiguousEmptyNestedArray->ErrorHandling.mkLogAndRaise(
        ~msg="The given empty array could be interperated as a flat array (value) or nested array. Since it's ambiguous,
        please pass in a nested empty array if the intention is to provide an empty array as a value",
      )
    | Some(arr) => arr->Js.Array2.unsafe_get(0)->isMultiple(~nestedArrayDepth=nestedArrayDepth - 1)
    }

  let normalizeOrThrow = (t: t<'a>, ~nestedArrayDepth=0): array<'a> => {
    if t->isMultiple(~nestedArrayDepth) {
      t->castMultiple
    } else {
      [t->castSingle]
    }
  }
}

module HandlerTypes = {
  @genType
  type args<'eventArgs, 'context> = {
    event: eventLog<'eventArgs>,
    context: 'context,
  }

  @genType
  type contractRegisterArgs<'eventArgs> = args<'eventArgs, contractRegistrations>
  @genType
  type contractRegister<'eventArgs> = contractRegisterArgs<'eventArgs> => unit

  @genType
  type loaderArgs<'eventArgs> = args<'eventArgs, loaderContext>
  @genType
  type loader<'eventArgs, 'loaderReturn> = loaderArgs<'eventArgs> => promise<'loaderReturn>

  @genType
  type handlerArgs<'eventArgs, 'loaderReturn> = {
    event: eventLog<'eventArgs>,
    context: handlerContext,
    loaderReturn: 'loaderReturn,
  }

  @genType
  type handler<'eventArgs, 'loaderReturn> = handlerArgs<'eventArgs, 'loaderReturn> => promise<unit>

  @genType
  type loaderHandler<'eventArgs, 'loaderReturn, 'eventFilter> = {
    loader: loader<'eventArgs, 'loaderReturn>,
    handler: handler<'eventArgs, 'loaderReturn>,
    wildcard?: bool,
    eventFilters?: SingleOrMultiple.t<'eventFilter>,
  }

  @genType
  type eventConfig<'eventFilter> = {
    wildcard?: bool,
    eventFilters?: SingleOrMultiple.t<'eventFilter>,
  }

  module EventOptions = {
    type t = {
      isWildcard: bool,
      topicSelections: array<LogSelection.topicSelection>,
    }

    let getDefault = (~topic0) => {
      isWildcard: false,
      topicSelections: [LogSelection.makeTopicSelection(~topic0=[topic0])->Utils.unwrapResultExn],
    }

    let make = (~isWildcard, ~topicSelections: array<LogSelection.topicSelection>) => {
      let topic0sGrouped = []
      let topicSelectionWithFilters = []
      topicSelections->Belt.Array.forEach(ts =>
        if ts->LogSelection.hasFilters {
          topicSelectionWithFilters->Js.Array2.push(ts)->ignore
        } else {
          ts.topic0->Belt.Array.forEach(topic0 => {
            topic0sGrouped->Js.Array2.push(topic0)->ignore
          })
        }
      )
      let topicSelections = switch topic0sGrouped {
      | [] => topicSelectionWithFilters
      | topic0sGrouped =>
        [
          LogSelection.makeTopicSelection(~topic0=topic0sGrouped)->Utils.unwrapResultExn,
        ]->Belt.Array.concat(topicSelectionWithFilters)
      }

      {
        isWildcard,
        topicSelections,
      }
    }
  }

  type registeredEvent<'eventArgs, 'loaderReturn, 'eventFilter> = {
    loaderHandler?: loaderHandler<'eventArgs, 'loaderReturn, 'eventFilter>,
    contractRegister?: contractRegister<'eventArgs>,
    eventOptions: EventOptions.t,
  }

  module Register: {
    type t<'eventArgs>
    let make: (~topic0: EvmTypes.Hex.t, ~contractName: string, ~eventName: string) => t<'eventArgs>
    let setLoaderHandler: (
      t<'eventArgs>,
      loaderHandler<'eventArgs, 'loaderReturn, 'eventFilter>,
      ~getEventOptions: loaderHandler<'eventArgs, 'loaderReturn, 'eventFilter> => option<
        EventOptions.t,
      >,
      ~logger: Pino.t=?,
    ) => unit
    let setContractRegister: (
      t<'eventArgs>,
      contractRegister<'eventArgs>,
      ~eventOptions: option<EventOptions.t>,
      ~logger: Pino.t=?,
    ) => unit
    let getLoaderHandler: t<'eventArgs> => option<
      loaderHandler<'eventArgs, 'loaderReturn, 'eventFilter>,
    >
    let getContractRegister: t<'eventArgs> => option<contractRegister<'eventArgs>>
    let getEventOptions: t<'eventArgs> => EventOptions.t
    let hasRegistration: t<'eventArgs> => bool
  } = {
    type loaderReturn
    type eventFilter

    type t<'eventArgs> = {
      contractName: string,
      eventName: string,
      topic0: EvmTypes.Hex.t,
      mutable loaderHandler: option<loaderHandler<'eventArgs, loaderReturn, eventFilter>>,
      mutable contractRegister: option<contractRegister<'eventArgs>>,
      mutable eventOptions: option<EventOptions.t>,
    }

    let getLoaderHandler = (t: t<'eventArgs>): option<
      loaderHandler<'eventArgs, 'loaderReturn, 'eventFilter>,
    > =>
      t.loaderHandler->(
        Utils.magic: option<loaderHandler<'eventArgs, loaderReturn, eventFilter>> => option<
          loaderHandler<'eventArgs, 'loaderReturn, 'eventFilter>,
        >
      )

    let getContractRegister = (t: t<'eventArgs>): option<contractRegister<'eventArgs>> =>
      t.contractRegister

    let getEventOptions = ({eventOptions, topic0}: t<'eventArgs>): EventOptions.t =>
      switch eventOptions {
      | Some(eventOptions) => eventOptions
      | None => EventOptions.getDefault(~topic0)
      }

    let hasRegistration = ({loaderHandler, contractRegister}) =>
      loaderHandler->Belt.Option.isSome || contractRegister->Belt.Option.isSome

    let make = (~topic0, ~contractName, ~eventName) => {
      contractName,
      eventName,
      topic0,
      loaderHandler: None,
      contractRegister: None,
      eventOptions: None,
    }

    type eventNamespace = {contractName: string, eventName: string}
    exception DuplicateEventRegistration(eventNamespace)

    let setEventOptions = (t: t<'eventArgs>, value: EventOptions.t, ~logger=Logging.logger) => {
      switch t.eventOptions {
      | None => t.eventOptions = Some(value)
      | Some(_) =>
        let eventNamespace = {contractName: t.contractName, eventName: t.eventName}
        DuplicateEventRegistration(eventNamespace)->ErrorHandling.mkLogAndRaise(
          ~logger=Logging.createChildFrom(~logger, ~params=eventNamespace),
          ~msg="Duplicate eventOptions in handlers not allowed",
        )
      }
    }

    let setLoaderHandler = (
      t: t<'eventArgs>,
      value: loaderHandler<'eventArgs, 'loaderReturn, 'eventFilter>,
      ~getEventOptions,
      ~logger=Logging.logger,
    ) => {
      switch t.loaderHandler {
      | None =>
        t.loaderHandler =
          value
          ->(Utils.magic: loaderHandler<'eventArgs, 'loaderReturn, 'eventFilter> => loaderHandler<
            'eventArgs,
            loaderReturn,
            eventFilter,
          >)
          ->Some
      | Some(_) =>
        let eventNamespace = {contractName: t.contractName, eventName: t.eventName}
        DuplicateEventRegistration(eventNamespace)->ErrorHandling.mkLogAndRaise(
          ~logger=Logging.createChildFrom(~logger, ~params=eventNamespace),
          ~msg="Duplicate registration of event handlers not allowed",
        )
      }

      switch getEventOptions(value) {
      | Some(eventOptions) => t->setEventOptions(eventOptions, ~logger)
      | None => ()
      }
    }

    let setContractRegister = (
      t: t<'eventArgs>,
      value: contractRegister<'eventArgs>,
      ~eventOptions,
      ~logger=Logging.logger,
    ) => {
      switch t.contractRegister {
      | None => t.contractRegister = Some(value)
      | Some(_) =>
        let eventNamespace = {contractName: t.contractName, eventName: t.eventName}
        DuplicateEventRegistration(eventNamespace)->ErrorHandling.mkLogAndRaise(
          ~logger=Logging.createChildFrom(~logger, ~params=eventNamespace),
          ~msg="Duplicate contractRegister handlers not allowed",
        )
      }
      switch eventOptions {
      | Some(eventOptions) => t->setEventOptions(eventOptions, ~logger)
      | None => ()
      }
    }
  }
}

type internalEventArgs

module type Event = {
  let sighash: string // topic0 for Evm and rb for Fuel receipts
  let topicCount: int // Number of topics for evm, always 0 for fuel
  let name: string
  let contractName: string

  type eventArgs
  let paramsRawEventSchema: S.schema<eventArgs>
  let convertHyperSyncEventArgs: HyperSyncClient.Decoder.decodedEvent => eventArgs
  let handlerRegister: HandlerTypes.Register.t<eventArgs>

  type eventFilter
  let getTopicSelection: SingleOrMultiple.t<eventFilter> => array<LogSelection.topicSelection>
}
module type InternalEvent = Event with type eventArgs = internalEventArgs

external eventToInternal: eventLog<'a> => eventLog<internalEventArgs> = "%identity"
external eventModToInternal: module(Event with type eventArgs = 'a) => module(InternalEvent) = "%identity"
external eventModWithoutArgTypeToInternal: module(Event) => module(InternalEvent) = "%identity"

let makeEventOptions = (
  type eventFilter,
  eventConfig: option<HandlerTypes.eventConfig<eventFilter>>,
  eventMod: module(Event with type eventFilter = eventFilter),
) => {
  let module(Event) = eventMod
  open Belt
  eventConfig->Option.map(({?wildcard, ?eventFilters}) =>
    HandlerTypes.EventOptions.make(
      ~isWildcard=wildcard->Option.getWithDefault(false),
      ~topicSelections=eventFilters->Option.mapWithDefault(
        [
          LogSelection.makeTopicSelection(
            ~topic0=[Event.sighash->EvmTypes.Hex.fromStringUnsafe],
          )->Utils.unwrapResultExn,
        ],
        v => v->Event.getTopicSelection,
      ),
    )
  )
}

let makeGetEventOptions = (
  type eventFilter eventArgs,
  eventMod: module(Event with type eventFilter = eventFilter and type eventArgs = eventArgs),
) => {
  open Belt
  let module(Event) = eventMod
  (loaderHandler: HandlerTypes.loaderHandler<Event.eventArgs, 'loaderReturn, Event.eventFilter>) =>
    switch loaderHandler {
    | {wildcard: ?None, eventFilters: ?None} => None
    | {?wildcard, ?eventFilters} =>
      let topicSelections =
        eventFilters->Option.mapWithDefault(
          [
            LogSelection.makeTopicSelection(
              ~topic0=[Event.sighash->EvmTypes.Hex.fromStringUnsafe],
            )->Utils.unwrapResultExn,
          ],
          v => v->Event.getTopicSelection,
        )
      HandlerTypes.EventOptions.make(
        ~isWildcard=wildcard->Option.getWithDefault(false),
        ~topicSelections,
      )->Some
    }
}

@genType.import(("./bindings/OpaqueTypes.ts", "HandlerWithOptions"))
type fnWithEventConfig<'fn, 'eventConfig> = ('fn, ~eventConfig: 'eventConfig=?) => unit

@genType
type handlerWithOptions<'eventArgs, 'loaderReturn, 'eventFilter> = fnWithEventConfig<
  HandlerTypes.handler<'eventArgs, 'loaderReturn>,
  HandlerTypes.eventConfig<'eventFilter>,
>

@genType
type contractRegisterWithOptions<'eventArgs, 'eventFilter> = fnWithEventConfig<
  HandlerTypes.contractRegister<'eventArgs>,
  HandlerTypes.eventConfig<'eventFilter>,
>

module MakeRegister = (Event: Event) => {
  let handler: handlerWithOptions<Event.eventArgs, unit, Event.eventFilter> = (
    handler,
    ~eventConfig=?,
  ) => {
    Event.handlerRegister->HandlerTypes.Register.setLoaderHandler(
      {
        loader: _ => Promise.resolve(),
        handler,
        wildcard: ?eventConfig->Belt.Option.flatMap(c => c.wildcard),
        eventFilters: ?eventConfig->Belt.Option.flatMap(c => c.eventFilters),
      },
      ~getEventOptions=makeGetEventOptions(module(Event)),
    )
  }

  let contractRegister: contractRegisterWithOptions<Event.eventArgs, Event.eventFilter> = (
    contractRegister,
    ~eventConfig=?,
  ) =>
    Event.handlerRegister->HandlerTypes.Register.setContractRegister(
      contractRegister,
      ~eventOptions=makeEventOptions(eventConfig, module(Event)),
    )

  let handlerWithLoader = args =>
    Event.handlerRegister->HandlerTypes.Register.setLoaderHandler(
      args,
      ~getEventOptions=makeGetEventOptions(module(Event)),
    )
}

type fuelEventKind = 
  | LogData({
    logId: string,
    decode: string => internalEventArgs,
  })
  | Mint
  | Burn
  | Transfer
  | Call

type fuelEventConfig = {
  name: string,
  kind: fuelEventKind,
  isWildcard: bool,
  handlerRegister: HandlerTypes.Register.t<internalEventArgs>,
  paramsRawEventSchema: S.schema<internalEventArgs>,
}

type fuelContractConfig = {
  name: string,
  events: array<fuelEventConfig>,
}

type fuelSupplyParams = {
  subId: string,
  amount: bigint,
}

let fuelSupplyParamsSchema = S.object(s => {
  subId: s.field("subId", S.string),
  amount: s.field("amount", BigInt.schema),
})

type fuelTransferParams = {
  to: Address.t,
  assetId: string,
  amount: bigint,
}

let fuelTransferParamsSchema = S.object(s => {
  to: s.field("to", Address.schema),
  assetId: s.field("assetId", S.string),
  amount: s.field("amount", BigInt.schema),
})

module Market = {
let abi = Fuel.transpileAbi(%raw(`require("../../abis/market.json")`))
/*Silence warning of label defined in multiple types*/
@@warning("-30")
type rec type0 = (type48, type48)
 and type1 = (type45, type45)
 and type2 = (type48, type48, type46)
 and type3 = (type48, type48, type48, type48)
 and type4 = (type40, type47, type40, type47, type19<type18>, type47, type47)
 @tag("case") and type5 = | Base({payload: type44}) | Quote({payload: type44})
 @tag("case") and type6 = | GTC({payload: type44}) | IOC({payload: type44}) | FOK({payload: type44})
 @tag("case") and type7 = | OrderOpened({payload: type44}) | OrderCancelled({payload: type44}) | OrderMatched({payload: type44})
 @tag("case") and type8 = | Buy({payload: type44}) | Sell({payload: type44})
 @tag("case") and type9 = | InsufficientBalance({payload: type2})
 @tag("case") and type10 = | InvalidAsset({payload: type44}) | InvalidFeeAsset({payload: type44}) | InvalidMarketAsset({payload: type44})
 @tag("case") and type11 = | Unauthorized({payload: type44})
 @tag("case") and type12 = | CantMatch({payload: type1}) | CantMatchMany({payload: type44}) | CantFulfillMany({payload: type44}) | CantFulfillFOK({payload: type44})
 @tag("case") and type13 = | Overflow({payload: type44})
 @tag("case") and type14 = | OrderDuplicate({payload: type45}) | OrderNotFound({payload: type45}) | PriceTooSmall({payload: type0}) | ZeroOrderAmount({payload: type44}) | ZeroLockAmount({payload: type44}) | ZeroUnlockAmount({payload: type44}) | ZeroTransferAmount({payload: type44}) | FailedToRemove({payload: type45})
 @tag("case") and type15 = | InvalidAmount({payload: type44}) | InvalidSlippage({payload: type44}) | InvalidArrayLength({payload: type44}) | InvalidFeeAmount({payload: type0}) | InvalidEpoch({payload: type3}) | InvalidFeeSorting({payload: type44}) | InvalidFeeZeroBased({payload: type44}) | InvalidValueSame({payload: type44}) | InvalidMarketSame({payload: type44})
 @tag("case") and type16 = | NotOwner({payload: type44})
 @tag("case") and type17 = | Uninitialized({payload: type44}) | Initialized({payload: type18}) | Revoked({payload: type44})
 @tag("case") and type18 = | Address({payload: type39}) | ContractId({payload: type41})
 @tag("case") and type19<'t> = | None({payload: type44}) | Some({payload: 't})
 @tag("case") and type20 = | NonReentrant({payload: type44})
 and type22 = bigint
 and type23 = {liquid: type24, locked: type24}
 and type24 = {base: type48, quote: type48}
 and type25 = {amount: type48, asset_type: type5, order_type: type8, owner: type18, price: type48, block_height: type47, order_height: type48, matcher_fee: type48, protocol_maker_fee: type48, protocol_taker_fee: type48}
 and type26 = {change_type: type7, block_height: type47, sender: type18, tx_id: type45, amount_before: type48, amount_after: type48}
 and type27 = {maker_fee: type48, taker_fee: type48, volume_threshold: type48}
 and type28 = {order_id: type45, user: type18, balance: type23}
 and type29 = {amount: type48, asset: type40, user: type18, account: type23}
 and type30 = {amount: type48, asset: type40, user: type18, account: type23, caller: type18}
 and type31 = {amount: type48, asset: type40, order_type: type8, order_id: type45, price: type48, user: type18, balance: type23}
 and type32 = {epoch: type48, epoch_duration: type48}
 and type33 = {amount: type48}
 and type34 = {protocol_fee: type43<type27>}
 and type35 = {store: type46}
 and type36 = {base_sell_order_id: type45, base_buy_order_id: type45, base_sell_order_limit: type6, base_buy_order_limit: type6, order_matcher: type18, trade_size: type48, trade_price: type48, block_height: type47, tx_id: type45, order_seller: type18, order_buyer: type18, s_balance: type23, b_balance: type23, seller_is_maker: type46}
 and type37 = {amount: type48, asset: type40, user: type18, account: type23}
 and type38 = {amount: type48, asset: type40, user: type18, account: type23, market: type41}
 and type39 = {bits: type45}
 and type40 = {bits: type45}
 and type41 = {bits: type45}
 and type42<'t> = {ptr: type22, cap: type48}
 and type43<'t> = array<'t>
 and type44 = unit
 and type45 = string
 and type46 = bool
 and type47 = int
 and type48 = bigint
@@warning("+30")
let type22Schema = BigInt.schema
let type43Schema = (_tSchema: S.t<'t>) => S.array(_tSchema)
let type44Schema = S.literal(%raw(`null`))->S.variant(_ => ())
let type45Schema = S.string
let type46Schema = S.bool
let type47Schema = GqlDbCustomTypes.Int.schema
let type48Schema = BigInt.schema
let type0Schema = S.tuple(s => (s.item(0, type48Schema), s.item(1, type48Schema)))
let type1Schema = S.tuple(s => (s.item(0, type45Schema), s.item(1, type45Schema)))
let type2Schema = S.tuple(s => (s.item(0, type48Schema), s.item(1, type48Schema), s.item(2, type46Schema)))
let type3Schema = S.tuple(s => (s.item(0, type48Schema), s.item(1, type48Schema), s.item(2, type48Schema), s.item(3, type48Schema)))
let type5Schema = S.union([S.object((s): type5 =>
{
  s.tag("case", "Base")
  Base({payload: s.field("payload", type44Schema)})
}), S.object((s): type5 =>
{
  s.tag("case", "Quote")
  Quote({payload: s.field("payload", type44Schema)})
})])
let type6Schema = S.union([S.object((s): type6 =>
{
  s.tag("case", "GTC")
  GTC({payload: s.field("payload", type44Schema)})
}), S.object((s): type6 =>
{
  s.tag("case", "IOC")
  IOC({payload: s.field("payload", type44Schema)})
}), S.object((s): type6 =>
{
  s.tag("case", "FOK")
  FOK({payload: s.field("payload", type44Schema)})
})])
let type7Schema = S.union([S.object((s): type7 =>
{
  s.tag("case", "OrderOpened")
  OrderOpened({payload: s.field("payload", type44Schema)})
}), S.object((s): type7 =>
{
  s.tag("case", "OrderCancelled")
  OrderCancelled({payload: s.field("payload", type44Schema)})
}), S.object((s): type7 =>
{
  s.tag("case", "OrderMatched")
  OrderMatched({payload: s.field("payload", type44Schema)})
})])
let type8Schema = S.union([S.object((s): type8 =>
{
  s.tag("case", "Buy")
  Buy({payload: s.field("payload", type44Schema)})
}), S.object((s): type8 =>
{
  s.tag("case", "Sell")
  Sell({payload: s.field("payload", type44Schema)})
})])
let type9Schema = S.union([S.object((s): type9 =>
{
  s.tag("case", "InsufficientBalance")
  InsufficientBalance({payload: s.field("payload", type2Schema)})
})])
let type10Schema = S.union([S.object((s): type10 =>
{
  s.tag("case", "InvalidAsset")
  InvalidAsset({payload: s.field("payload", type44Schema)})
}), S.object((s): type10 =>
{
  s.tag("case", "InvalidFeeAsset")
  InvalidFeeAsset({payload: s.field("payload", type44Schema)})
}), S.object((s): type10 =>
{
  s.tag("case", "InvalidMarketAsset")
  InvalidMarketAsset({payload: s.field("payload", type44Schema)})
})])
let type11Schema = S.union([S.object((s): type11 =>
{
  s.tag("case", "Unauthorized")
  Unauthorized({payload: s.field("payload", type44Schema)})
})])
let type12Schema = S.union([S.object((s): type12 =>
{
  s.tag("case", "CantMatch")
  CantMatch({payload: s.field("payload", type1Schema)})
}), S.object((s): type12 =>
{
  s.tag("case", "CantMatchMany")
  CantMatchMany({payload: s.field("payload", type44Schema)})
}), S.object((s): type12 =>
{
  s.tag("case", "CantFulfillMany")
  CantFulfillMany({payload: s.field("payload", type44Schema)})
}), S.object((s): type12 =>
{
  s.tag("case", "CantFulfillFOK")
  CantFulfillFOK({payload: s.field("payload", type44Schema)})
})])
let type13Schema = S.union([S.object((s): type13 =>
{
  s.tag("case", "Overflow")
  Overflow({payload: s.field("payload", type44Schema)})
})])
let type14Schema = S.union([S.object((s): type14 =>
{
  s.tag("case", "OrderDuplicate")
  OrderDuplicate({payload: s.field("payload", type45Schema)})
}), S.object((s): type14 =>
{
  s.tag("case", "OrderNotFound")
  OrderNotFound({payload: s.field("payload", type45Schema)})
}), S.object((s): type14 =>
{
  s.tag("case", "PriceTooSmall")
  PriceTooSmall({payload: s.field("payload", type0Schema)})
}), S.object((s): type14 =>
{
  s.tag("case", "ZeroOrderAmount")
  ZeroOrderAmount({payload: s.field("payload", type44Schema)})
}), S.object((s): type14 =>
{
  s.tag("case", "ZeroLockAmount")
  ZeroLockAmount({payload: s.field("payload", type44Schema)})
}), S.object((s): type14 =>
{
  s.tag("case", "ZeroUnlockAmount")
  ZeroUnlockAmount({payload: s.field("payload", type44Schema)})
}), S.object((s): type14 =>
{
  s.tag("case", "ZeroTransferAmount")
  ZeroTransferAmount({payload: s.field("payload", type44Schema)})
}), S.object((s): type14 =>
{
  s.tag("case", "FailedToRemove")
  FailedToRemove({payload: s.field("payload", type45Schema)})
})])
let type15Schema = S.union([S.object((s): type15 =>
{
  s.tag("case", "InvalidAmount")
  InvalidAmount({payload: s.field("payload", type44Schema)})
}), S.object((s): type15 =>
{
  s.tag("case", "InvalidSlippage")
  InvalidSlippage({payload: s.field("payload", type44Schema)})
}), S.object((s): type15 =>
{
  s.tag("case", "InvalidArrayLength")
  InvalidArrayLength({payload: s.field("payload", type44Schema)})
}), S.object((s): type15 =>
{
  s.tag("case", "InvalidFeeAmount")
  InvalidFeeAmount({payload: s.field("payload", type0Schema)})
}), S.object((s): type15 =>
{
  s.tag("case", "InvalidEpoch")
  InvalidEpoch({payload: s.field("payload", type3Schema)})
}), S.object((s): type15 =>
{
  s.tag("case", "InvalidFeeSorting")
  InvalidFeeSorting({payload: s.field("payload", type44Schema)})
}), S.object((s): type15 =>
{
  s.tag("case", "InvalidFeeZeroBased")
  InvalidFeeZeroBased({payload: s.field("payload", type44Schema)})
}), S.object((s): type15 =>
{
  s.tag("case", "InvalidValueSame")
  InvalidValueSame({payload: s.field("payload", type44Schema)})
}), S.object((s): type15 =>
{
  s.tag("case", "InvalidMarketSame")
  InvalidMarketSame({payload: s.field("payload", type44Schema)})
})])
let type16Schema = S.union([S.object((s): type16 =>
{
  s.tag("case", "NotOwner")
  NotOwner({payload: s.field("payload", type44Schema)})
})])
let type19Schema = (_tSchema: S.t<'t>) => S.union([S.object((s): type19<'t> =>
{
  s.tag("case", "None")
  None({payload: s.field("payload", type44Schema)})
}), S.object((s): type19<'t> =>
{
  s.tag("case", "Some")
  Some({payload: s.field("payload", _tSchema)})
})])
let type20Schema = S.union([S.object((s): type20 =>
{
  s.tag("case", "NonReentrant")
  NonReentrant({payload: s.field("payload", type44Schema)})
})])
let type24Schema = S.object((s): type24 => {base: s.field("base", type48Schema), quote: s.field("quote", type48Schema)})
let type27Schema = S.object((s): type27 => {maker_fee: s.field("maker_fee", type48Schema), taker_fee: s.field("taker_fee", type48Schema), volume_threshold: s.field("volume_threshold", type48Schema)})
let type32Schema = S.object((s): type32 => {epoch: s.field("epoch", type48Schema), epoch_duration: s.field("epoch_duration", type48Schema)})
let type33Schema = S.object((s): type33 => {amount: s.field("amount", type48Schema)})
let type34Schema = S.object((s): type34 => {protocol_fee: s.field("protocol_fee", type43Schema(type27Schema))})
let type35Schema = S.object((s): type35 => {store: s.field("store", type46Schema)})
let type39Schema = S.object((s): type39 => {bits: s.field("bits", type45Schema)})
let type40Schema = S.object((s): type40 => {bits: s.field("bits", type45Schema)})
let type41Schema = S.object((s): type41 => {bits: s.field("bits", type45Schema)})
let type42Schema = (_tSchema: S.t<'t>) => S.object((s): type42<'t> => {ptr: s.field("ptr", type22Schema), cap: s.field("cap", type48Schema)})
let type18Schema = S.union([S.object((s): type18 =>
{
  s.tag("case", "Address")
  Address({payload: s.field("payload", type39Schema)})
}), S.object((s): type18 =>
{
  s.tag("case", "ContractId")
  ContractId({payload: s.field("payload", type41Schema)})
})])
let type4Schema = S.tuple(s => (s.item(0, type40Schema), s.item(1, type47Schema), s.item(2, type40Schema), s.item(3, type47Schema), s.item(4, type19Schema(type18Schema)), s.item(5, type47Schema), s.item(6, type47Schema)))
let type23Schema = S.object((s): type23 => {liquid: s.field("liquid", type24Schema), locked: s.field("locked", type24Schema)})
let type25Schema = S.object((s): type25 => {amount: s.field("amount", type48Schema), asset_type: s.field("asset_type", type5Schema), order_type: s.field("order_type", type8Schema), owner: s.field("owner", type18Schema), price: s.field("price", type48Schema), block_height: s.field("block_height", type47Schema), order_height: s.field("order_height", type48Schema), matcher_fee: s.field("matcher_fee", type48Schema), protocol_maker_fee: s.field("protocol_maker_fee", type48Schema), protocol_taker_fee: s.field("protocol_taker_fee", type48Schema)})
let type26Schema = S.object((s): type26 => {change_type: s.field("change_type", type7Schema), block_height: s.field("block_height", type47Schema), sender: s.field("sender", type18Schema), tx_id: s.field("tx_id", type45Schema), amount_before: s.field("amount_before", type48Schema), amount_after: s.field("amount_after", type48Schema)})
let type28Schema = S.object((s): type28 => {order_id: s.field("order_id", type45Schema), user: s.field("user", type18Schema), balance: s.field("balance", type23Schema)})
let type29Schema = S.object((s): type29 => {amount: s.field("amount", type48Schema), asset: s.field("asset", type40Schema), user: s.field("user", type18Schema), account: s.field("account", type23Schema)})
let type30Schema = S.object((s): type30 => {amount: s.field("amount", type48Schema), asset: s.field("asset", type40Schema), user: s.field("user", type18Schema), account: s.field("account", type23Schema), caller: s.field("caller", type18Schema)})
let type31Schema = S.object((s): type31 => {amount: s.field("amount", type48Schema), asset: s.field("asset", type40Schema), order_type: s.field("order_type", type8Schema), order_id: s.field("order_id", type45Schema), price: s.field("price", type48Schema), user: s.field("user", type18Schema), balance: s.field("balance", type23Schema)})
let type36Schema = S.object((s): type36 => {base_sell_order_id: s.field("base_sell_order_id", type45Schema), base_buy_order_id: s.field("base_buy_order_id", type45Schema), base_sell_order_limit: s.field("base_sell_order_limit", type6Schema), base_buy_order_limit: s.field("base_buy_order_limit", type6Schema), order_matcher: s.field("order_matcher", type18Schema), trade_size: s.field("trade_size", type48Schema), trade_price: s.field("trade_price", type48Schema), block_height: s.field("block_height", type47Schema), tx_id: s.field("tx_id", type45Schema), order_seller: s.field("order_seller", type18Schema), order_buyer: s.field("order_buyer", type18Schema), s_balance: s.field("s_balance", type23Schema), b_balance: s.field("b_balance", type23Schema), seller_is_maker: s.field("seller_is_maker", type46Schema)})
let type37Schema = S.object((s): type37 => {amount: s.field("amount", type48Schema), asset: s.field("asset", type40Schema), user: s.field("user", type18Schema), account: s.field("account", type23Schema)})
let type38Schema = S.object((s): type38 => {amount: s.field("amount", type48Schema), asset: s.field("asset", type40Schema), user: s.field("user", type18Schema), account: s.field("account", type23Schema), market: s.field("market", type41Schema)})
let type17Schema = S.union([S.object((s): type17 =>
{
  s.tag("case", "Uninitialized")
  Uninitialized({payload: s.field("payload", type44Schema)})
}), S.object((s): type17 =>
{
  s.tag("case", "Initialized")
  Initialized({payload: s.field("payload", type18Schema)})
}), S.object((s): type17 =>
{
  s.tag("case", "Revoked")
  Revoked({payload: s.field("payload", type44Schema)})
})])
let contractName = "Market"

module DepositEvent = {

let sighash = "12590297951544646752"
let topicCount = 0
let name = "DepositEvent"
let contractName = contractName

@genType
type eventArgs = type29
let paramsRawEventSchema = type29Schema->Utils.Schema.coerceToJsonPgType
let convertHyperSyncEventArgs = (Utils.magic: HyperSyncClient.Decoder.decodedEvent => eventArgs)

let handlerRegister: HandlerTypes.Register.t<eventArgs> = HandlerTypes.Register.make(
  ~topic0=sighash->EvmTypes.Hex.fromStringUnsafe,
  ~contractName,
  ~eventName=name,
)

@genType
type eventFilter = {}

let getTopicSelection = _ => [LogSelection.makeTopicSelection(~topic0=[sighash->EvmTypes.Hex.fromStringUnsafe])->Utils.unwrapResultExn]

let register = (): fuelEventConfig => {
  name,
  kind: LogData({
  logId: sighash,
  decode: Fuel.Receipt.getLogDataDecoder(~abi, ~logId=sighash),
}),
  isWildcard: (handlerRegister->HandlerTypes.Register.getEventOptions).isWildcard,
  handlerRegister: handlerRegister->(Utils.magic: HandlerTypes.Register.t<eventArgs> => HandlerTypes.Register.t<internalEventArgs>),
  paramsRawEventSchema: paramsRawEventSchema->(Utils.magic: S.t<eventArgs> => S.t<internalEventArgs>),
}
}

module DepositForEvent = {

let sighash = "12112124172827649831"
let topicCount = 0
let name = "DepositForEvent"
let contractName = contractName

@genType
type eventArgs = type30
let paramsRawEventSchema = type30Schema->Utils.Schema.coerceToJsonPgType
let convertHyperSyncEventArgs = (Utils.magic: HyperSyncClient.Decoder.decodedEvent => eventArgs)

let handlerRegister: HandlerTypes.Register.t<eventArgs> = HandlerTypes.Register.make(
  ~topic0=sighash->EvmTypes.Hex.fromStringUnsafe,
  ~contractName,
  ~eventName=name,
)

@genType
type eventFilter = {}

let getTopicSelection = _ => [LogSelection.makeTopicSelection(~topic0=[sighash->EvmTypes.Hex.fromStringUnsafe])->Utils.unwrapResultExn]

let register = (): fuelEventConfig => {
  name,
  kind: LogData({
  logId: sighash,
  decode: Fuel.Receipt.getLogDataDecoder(~abi, ~logId=sighash),
}),
  isWildcard: (handlerRegister->HandlerTypes.Register.getEventOptions).isWildcard,
  handlerRegister: handlerRegister->(Utils.magic: HandlerTypes.Register.t<eventArgs> => HandlerTypes.Register.t<internalEventArgs>),
  paramsRawEventSchema: paramsRawEventSchema->(Utils.magic: S.t<eventArgs> => S.t<internalEventArgs>),
}
}

module WithdrawEvent = {

let sighash = "10918704871079408520"
let topicCount = 0
let name = "WithdrawEvent"
let contractName = contractName

@genType
type eventArgs = type37
let paramsRawEventSchema = type37Schema->Utils.Schema.coerceToJsonPgType
let convertHyperSyncEventArgs = (Utils.magic: HyperSyncClient.Decoder.decodedEvent => eventArgs)

let handlerRegister: HandlerTypes.Register.t<eventArgs> = HandlerTypes.Register.make(
  ~topic0=sighash->EvmTypes.Hex.fromStringUnsafe,
  ~contractName,
  ~eventName=name,
)

@genType
type eventFilter = {}

let getTopicSelection = _ => [LogSelection.makeTopicSelection(~topic0=[sighash->EvmTypes.Hex.fromStringUnsafe])->Utils.unwrapResultExn]

let register = (): fuelEventConfig => {
  name,
  kind: LogData({
  logId: sighash,
  decode: Fuel.Receipt.getLogDataDecoder(~abi, ~logId=sighash),
}),
  isWildcard: (handlerRegister->HandlerTypes.Register.getEventOptions).isWildcard,
  handlerRegister: handlerRegister->(Utils.magic: HandlerTypes.Register.t<eventArgs> => HandlerTypes.Register.t<internalEventArgs>),
  paramsRawEventSchema: paramsRawEventSchema->(Utils.magic: S.t<eventArgs> => S.t<internalEventArgs>),
}
}

module WithdrawToMarketEvent = {

let sighash = "12551359631505241447"
let topicCount = 0
let name = "WithdrawToMarketEvent"
let contractName = contractName

@genType
type eventArgs = type38
let paramsRawEventSchema = type38Schema->Utils.Schema.coerceToJsonPgType
let convertHyperSyncEventArgs = (Utils.magic: HyperSyncClient.Decoder.decodedEvent => eventArgs)

let handlerRegister: HandlerTypes.Register.t<eventArgs> = HandlerTypes.Register.make(
  ~topic0=sighash->EvmTypes.Hex.fromStringUnsafe,
  ~contractName,
  ~eventName=name,
)

@genType
type eventFilter = {}

let getTopicSelection = _ => [LogSelection.makeTopicSelection(~topic0=[sighash->EvmTypes.Hex.fromStringUnsafe])->Utils.unwrapResultExn]

let register = (): fuelEventConfig => {
  name,
  kind: LogData({
  logId: sighash,
  decode: Fuel.Receipt.getLogDataDecoder(~abi, ~logId=sighash),
}),
  isWildcard: (handlerRegister->HandlerTypes.Register.getEventOptions).isWildcard,
  handlerRegister: handlerRegister->(Utils.magic: HandlerTypes.Register.t<eventArgs> => HandlerTypes.Register.t<internalEventArgs>),
  paramsRawEventSchema: paramsRawEventSchema->(Utils.magic: S.t<eventArgs> => S.t<internalEventArgs>),
}
}

module OpenOrderEvent = {

let sighash = "7812135309850120461"
let topicCount = 0
let name = "OpenOrderEvent"
let contractName = contractName

@genType
type eventArgs = type31
let paramsRawEventSchema = type31Schema->Utils.Schema.coerceToJsonPgType
let convertHyperSyncEventArgs = (Utils.magic: HyperSyncClient.Decoder.decodedEvent => eventArgs)

let handlerRegister: HandlerTypes.Register.t<eventArgs> = HandlerTypes.Register.make(
  ~topic0=sighash->EvmTypes.Hex.fromStringUnsafe,
  ~contractName,
  ~eventName=name,
)

@genType
type eventFilter = {}

let getTopicSelection = _ => [LogSelection.makeTopicSelection(~topic0=[sighash->EvmTypes.Hex.fromStringUnsafe])->Utils.unwrapResultExn]

let register = (): fuelEventConfig => {
  name,
  kind: LogData({
  logId: sighash,
  decode: Fuel.Receipt.getLogDataDecoder(~abi, ~logId=sighash),
}),
  isWildcard: (handlerRegister->HandlerTypes.Register.getEventOptions).isWildcard,
  handlerRegister: handlerRegister->(Utils.magic: HandlerTypes.Register.t<eventArgs> => HandlerTypes.Register.t<internalEventArgs>),
  paramsRawEventSchema: paramsRawEventSchema->(Utils.magic: S.t<eventArgs> => S.t<internalEventArgs>),
}
}

module CancelOrderEvent = {

let sighash = "14676650066558707344"
let topicCount = 0
let name = "CancelOrderEvent"
let contractName = contractName

@genType
type eventArgs = type28
let paramsRawEventSchema = type28Schema->Utils.Schema.coerceToJsonPgType
let convertHyperSyncEventArgs = (Utils.magic: HyperSyncClient.Decoder.decodedEvent => eventArgs)

let handlerRegister: HandlerTypes.Register.t<eventArgs> = HandlerTypes.Register.make(
  ~topic0=sighash->EvmTypes.Hex.fromStringUnsafe,
  ~contractName,
  ~eventName=name,
)

@genType
type eventFilter = {}

let getTopicSelection = _ => [LogSelection.makeTopicSelection(~topic0=[sighash->EvmTypes.Hex.fromStringUnsafe])->Utils.unwrapResultExn]

let register = (): fuelEventConfig => {
  name,
  kind: LogData({
  logId: sighash,
  decode: Fuel.Receipt.getLogDataDecoder(~abi, ~logId=sighash),
}),
  isWildcard: (handlerRegister->HandlerTypes.Register.getEventOptions).isWildcard,
  handlerRegister: handlerRegister->(Utils.magic: HandlerTypes.Register.t<eventArgs> => HandlerTypes.Register.t<internalEventArgs>),
  paramsRawEventSchema: paramsRawEventSchema->(Utils.magic: S.t<eventArgs> => S.t<internalEventArgs>),
}
}

module TradeOrderEvent = {

let sighash = "18305104039093136274"
let topicCount = 0
let name = "TradeOrderEvent"
let contractName = contractName

@genType
type eventArgs = type36
let paramsRawEventSchema = type36Schema->Utils.Schema.coerceToJsonPgType
let convertHyperSyncEventArgs = (Utils.magic: HyperSyncClient.Decoder.decodedEvent => eventArgs)

let handlerRegister: HandlerTypes.Register.t<eventArgs> = HandlerTypes.Register.make(
  ~topic0=sighash->EvmTypes.Hex.fromStringUnsafe,
  ~contractName,
  ~eventName=name,
)

@genType
type eventFilter = {}

let getTopicSelection = _ => [LogSelection.makeTopicSelection(~topic0=[sighash->EvmTypes.Hex.fromStringUnsafe])->Utils.unwrapResultExn]

let register = (): fuelEventConfig => {
  name,
  kind: LogData({
  logId: sighash,
  decode: Fuel.Receipt.getLogDataDecoder(~abi, ~logId=sighash),
}),
  isWildcard: (handlerRegister->HandlerTypes.Register.getEventOptions).isWildcard,
  handlerRegister: handlerRegister->(Utils.magic: HandlerTypes.Register.t<eventArgs> => HandlerTypes.Register.t<internalEventArgs>),
  paramsRawEventSchema: paramsRawEventSchema->(Utils.magic: S.t<eventArgs> => S.t<internalEventArgs>),
}
}
}

module Registry = {
let abi = Fuel.transpileAbi(%raw(`require("../../abis/registry.json")`))
/*Silence warning of label defined in multiple types*/
@@warning("-30")
type rec type0 = (type8<type7>, type20)
 and type1 = (type14, type14)
 and type2 = (type14, type14, type8<type15>)
 and type3 = string
 @tag("case") and type4 = | MarketAlreadyRegistered({payload: type19}) | MarketNotRegistered({payload: type19})
 @tag("case") and type5 = | NotOwner({payload: type19})
 @tag("case") and type6 = | Uninitialized({payload: type19}) | Initialized({payload: type7}) | Revoked({payload: type19})
 @tag("case") and type7 = | Address({payload: type13}) | ContractId({payload: type15})
 @tag("case") and type8<'t> = | None({payload: type19}) | Some({payload: 't})
 and type10 = bigint
 and type11 = {base: type14, quote: type14, market: type15}
 and type12 = {base: type14, quote: type14, market: type15}
 and type13 = {bits: type3}
 and type14 = {bits: type3}
 and type15 = {bits: type3}
 and type16<'t> = {ptr: type10, cap: type18}
 and type17<'t> = array<'t>
 and type18 = bigint
 and type19 = unit
 and type20 = int
@@warning("+30")
let type3Schema = S.string
let type10Schema = BigInt.schema
let type13Schema = S.object((s): type13 => {bits: s.field("bits", type3Schema)})
let type14Schema = S.object((s): type14 => {bits: s.field("bits", type3Schema)})
let type15Schema = S.object((s): type15 => {bits: s.field("bits", type3Schema)})
let type17Schema = (_tSchema: S.t<'t>) => S.array(_tSchema)
let type18Schema = BigInt.schema
let type19Schema = S.literal(%raw(`null`))->S.variant(_ => ())
let type20Schema = GqlDbCustomTypes.Int.schema
let type1Schema = S.tuple(s => (s.item(0, type14Schema), s.item(1, type14Schema)))
let type4Schema = S.union([S.object((s): type4 =>
{
  s.tag("case", "MarketAlreadyRegistered")
  MarketAlreadyRegistered({payload: s.field("payload", type19Schema)})
}), S.object((s): type4 =>
{
  s.tag("case", "MarketNotRegistered")
  MarketNotRegistered({payload: s.field("payload", type19Schema)})
})])
let type5Schema = S.union([S.object((s): type5 =>
{
  s.tag("case", "NotOwner")
  NotOwner({payload: s.field("payload", type19Schema)})
})])
let type7Schema = S.union([S.object((s): type7 =>
{
  s.tag("case", "Address")
  Address({payload: s.field("payload", type13Schema)})
}), S.object((s): type7 =>
{
  s.tag("case", "ContractId")
  ContractId({payload: s.field("payload", type15Schema)})
})])
let type8Schema = (_tSchema: S.t<'t>) => S.union([S.object((s): type8<'t> =>
{
  s.tag("case", "None")
  None({payload: s.field("payload", type19Schema)})
}), S.object((s): type8<'t> =>
{
  s.tag("case", "Some")
  Some({payload: s.field("payload", _tSchema)})
})])
let type11Schema = S.object((s): type11 => {base: s.field("base", type14Schema), quote: s.field("quote", type14Schema), market: s.field("market", type15Schema)})
let type12Schema = S.object((s): type12 => {base: s.field("base", type14Schema), quote: s.field("quote", type14Schema), market: s.field("market", type15Schema)})
let type16Schema = (_tSchema: S.t<'t>) => S.object((s): type16<'t> => {ptr: s.field("ptr", type10Schema), cap: s.field("cap", type18Schema)})
let type0Schema = S.tuple(s => (s.item(0, type8Schema(type7Schema)), s.item(1, type20Schema)))
let type2Schema = S.tuple(s => (s.item(0, type14Schema), s.item(1, type14Schema), s.item(2, type8Schema(type15Schema))))
let type6Schema = S.union([S.object((s): type6 =>
{
  s.tag("case", "Uninitialized")
  Uninitialized({payload: s.field("payload", type19Schema)})
}), S.object((s): type6 =>
{
  s.tag("case", "Initialized")
  Initialized({payload: s.field("payload", type7Schema)})
}), S.object((s): type6 =>
{
  s.tag("case", "Revoked")
  Revoked({payload: s.field("payload", type19Schema)})
})])
let contractName = "Registry"

module MarketRegisterEvent = {

let sighash = "16526329487357911494"
let topicCount = 0
let name = "MarketRegisterEvent"
let contractName = contractName

@genType
type eventArgs = type11
let paramsRawEventSchema = type11Schema->Utils.Schema.coerceToJsonPgType
let convertHyperSyncEventArgs = (Utils.magic: HyperSyncClient.Decoder.decodedEvent => eventArgs)

let handlerRegister: HandlerTypes.Register.t<eventArgs> = HandlerTypes.Register.make(
  ~topic0=sighash->EvmTypes.Hex.fromStringUnsafe,
  ~contractName,
  ~eventName=name,
)

@genType
type eventFilter = {}

let getTopicSelection = _ => [LogSelection.makeTopicSelection(~topic0=[sighash->EvmTypes.Hex.fromStringUnsafe])->Utils.unwrapResultExn]

let register = (): fuelEventConfig => {
  name,
  kind: LogData({
  logId: sighash,
  decode: Fuel.Receipt.getLogDataDecoder(~abi, ~logId=sighash),
}),
  isWildcard: (handlerRegister->HandlerTypes.Register.getEventOptions).isWildcard,
  handlerRegister: handlerRegister->(Utils.magic: HandlerTypes.Register.t<eventArgs> => HandlerTypes.Register.t<internalEventArgs>),
  paramsRawEventSchema: paramsRawEventSchema->(Utils.magic: S.t<eventArgs> => S.t<internalEventArgs>),
}
}
}

@genType
type chainId = int

type eventBatchQueueItem = {
  eventName: string,
  contractName: string,
  handlerRegister: HandlerTypes.Register.t<internalEventArgs>,
  timestamp: int,
  chain: ChainMap.Chain.t,
  blockNumber: int,
  logIndex: int,
  event: eventLog<internalEventArgs>,
  paramsRawEventSchema: S.schema<internalEventArgs>,
  //Default to false, if an event needs to
  //be reprocessed after it has loaded dynamic contracts
  //This gets set to true and does not try and reload events
  hasRegisteredDynamicContracts?: bool,
}
