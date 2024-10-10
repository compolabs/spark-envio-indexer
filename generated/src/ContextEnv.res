open Types

/**
The context holds all the state for a given events loader and handler.
*/
type t = {
  logger: Pino.t,
  eventBatchQueueItem: Types.eventBatchQueueItem,
  addedDynamicContractRegistrations: array<TablesStatic.DynamicContractRegistry.t>,
}

let getUserLogger = (logger): Logs.userLogger => {
  info: (message: string) => logger->Logging.uinfo(message),
  debug: (message: string) => logger->Logging.udebug(message),
  warn: (message: string) => logger->Logging.uwarn(message),
  error: (message: string) => logger->Logging.uerror(message),
  errorWithExn: (exn: option<Js.Exn.t>, message: string) =>
    logger->Logging.uerrorWithExn(exn, message),
}

let makeEventIdentifier = (
  eventBatchQueueItem: Types.eventBatchQueueItem,
): Types.eventIdentifier => {
  let {event, blockNumber, timestamp} = eventBatchQueueItem
  {
    chainId: event.chainId,
    blockTimestamp: timestamp,
    blockNumber,
    logIndex: event.logIndex,
  }
}

let getEventId = (eventBatchQueueItem: Types.eventBatchQueueItem) => {
  EventUtils.packEventIndex(
    ~blockNumber=eventBatchQueueItem.blockNumber,
    ~logIndex=eventBatchQueueItem.event.logIndex,
  )
}

let make = (~eventBatchQueueItem: Types.eventBatchQueueItem, ~logger) => {
  let {event, chain, eventName, contractName, blockNumber} = eventBatchQueueItem
  let logger = logger->(
    Logging.createChildFrom(
      ~logger=_,
      ~params={
        "context": `Event '${eventName}' for contract '${contractName}'`,
        "chainId": chain->ChainMap.Chain.toChainId,
        "block": blockNumber,
        "logIndex": event.logIndex,
      },
    )
  )

  {
    logger,
    eventBatchQueueItem,
    addedDynamicContractRegistrations: [],
  }
}

let getAddedDynamicContractRegistrations = (contextEnv: t) =>
  contextEnv.addedDynamicContractRegistrations

let makeDynamicContractRegisterFn = (~contextEnv: t, ~contractName, ~inMemoryStore) => (
  contractAddress: Address.t,
) => {
    let {eventBatchQueueItem, addedDynamicContractRegistrations} = contextEnv
  let {chain, timestamp} = eventBatchQueueItem

  let eventId = eventBatchQueueItem->getEventId
  let chainId = chain->ChainMap.Chain.toChainId
  let dynamicContractRegistration: TablesStatic.DynamicContractRegistry.t = {
    chainId,
    eventId,
    blockTimestamp: timestamp,
    contractAddress,
    contractType: contractName,
  }

  addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

  inMemoryStore.InMemoryStore.dynamicContractRegistry->InMemoryTable.set(
    {chainId, contractAddress},
    dynamicContractRegistration,
  )
}

let makeWhereLoader = (
  loadLayer,
  ~entityMod,
  ~inMemoryStore,
  ~fieldName,
  ~fieldValueSchema,
  ~logger,
) => {
  Entities.eq: loadLayer->LoadLayer.makeWhereEqLoader(
    ~entityMod,
    ~fieldName,
    ~fieldValueSchema,
    ~inMemoryStore,
    ~logger,
  ),
}

let makeEntityHandlerContext = (
  type entity,
  ~eventIdentifier,
  ~inMemoryStore,
  ~entityMod: module(Entities.Entity with type t = entity),
  ~logger,
  ~getKey,
  ~loadLayer,
  ~isInReorgThreshold,
): entityHandlerContext<entity> => {
  let inMemTable = inMemoryStore->InMemoryStore.getInMemTable(~entityMod)
  let shouldSaveHistory =
    RegisterHandlers.getConfig()->Config.shouldSaveHistory(~isInReorgThreshold)
  {
    set: entity => {
      inMemTable->InMemoryTable.Entity.set(
        Set(entity)->Types.mkEntityUpdate(~eventIdentifier, ~entityId=getKey(entity)),
        ~shouldSaveHistory,
      )
    },
    deleteUnsafe: entityId => {
      inMemTable->InMemoryTable.Entity.set(
        Delete->Types.mkEntityUpdate(~eventIdentifier, ~entityId),
        ~shouldSaveHistory,
      )
    },
    get: loadLayer->LoadLayer.makeLoader(~entityMod, ~logger, ~inMemoryStore),
  }
}

let getContractRegisterContext = (contextEnv, ~inMemoryStore) => {
  //TODO only add contracts we've registered for the event in the config
  addMarket:  makeDynamicContractRegisterFn(~contextEnv, ~inMemoryStore, ~contractName=Market),
  addRegistry:  makeDynamicContractRegisterFn(~contextEnv, ~inMemoryStore, ~contractName=Registry),
}

let getLoaderContext = (contextEnv: t, ~inMemoryStore: InMemoryStore.t, ~loadLayer: LoadLayer.t): loaderContext => {
  let {logger} = contextEnv
  {
    log: logger->getUserLogger,
    activeBuyOrder: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.ActiveBuyOrder),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        asset: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.ActiveBuyOrder),
          ~inMemoryStore,
          ~fieldName="asset",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        market: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.ActiveBuyOrder),
          ~inMemoryStore,
          ~fieldName="market",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        order_type: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.ActiveBuyOrder),
          ~inMemoryStore,
          ~fieldName="order_type",
          ~fieldValueSchema=Enums.OrderType.schema,
          ~logger,
        ),
      
        price: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.ActiveBuyOrder),
          ~inMemoryStore,
          ~fieldName="price",
          ~fieldValueSchema=BigInt.schema,
          ~logger,
        ),
      
        status: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.ActiveBuyOrder),
          ~inMemoryStore,
          ~fieldName="status",
          ~fieldValueSchema=Enums.OrderStatus.schema,
          ~logger,
        ),
      
        user: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.ActiveBuyOrder),
          ~inMemoryStore,
          ~fieldName="user",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    activeSellOrder: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.ActiveSellOrder),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        asset: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.ActiveSellOrder),
          ~inMemoryStore,
          ~fieldName="asset",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        market: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.ActiveSellOrder),
          ~inMemoryStore,
          ~fieldName="market",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        order_type: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.ActiveSellOrder),
          ~inMemoryStore,
          ~fieldName="order_type",
          ~fieldValueSchema=Enums.OrderType.schema,
          ~logger,
        ),
      
        price: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.ActiveSellOrder),
          ~inMemoryStore,
          ~fieldName="price",
          ~fieldValueSchema=BigInt.schema,
          ~logger,
        ),
      
        status: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.ActiveSellOrder),
          ~inMemoryStore,
          ~fieldName="status",
          ~fieldValueSchema=Enums.OrderStatus.schema,
          ~logger,
        ),
      
        user: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.ActiveSellOrder),
          ~inMemoryStore,
          ~fieldName="user",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    balance: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.Balance),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        market: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.Balance),
          ~inMemoryStore,
          ~fieldName="market",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        user: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.Balance),
          ~inMemoryStore,
          ~fieldName="user",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    cancelOrderEvent: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.CancelOrderEvent),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        market: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.CancelOrderEvent),
          ~inMemoryStore,
          ~fieldName="market",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        order_id: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.CancelOrderEvent),
          ~inMemoryStore,
          ~fieldName="order_id",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        user: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.CancelOrderEvent),
          ~inMemoryStore,
          ~fieldName="user",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    depositEvent: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.DepositEvent),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        asset: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.DepositEvent),
          ~inMemoryStore,
          ~fieldName="asset",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        market: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.DepositEvent),
          ~inMemoryStore,
          ~fieldName="market",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        user: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.DepositEvent),
          ~inMemoryStore,
          ~fieldName="user",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    depositForEvent: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.DepositForEvent),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        asset: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.DepositForEvent),
          ~inMemoryStore,
          ~fieldName="asset",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        caller: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.DepositForEvent),
          ~inMemoryStore,
          ~fieldName="caller",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        market: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.DepositForEvent),
          ~inMemoryStore,
          ~fieldName="market",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        user: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.DepositForEvent),
          ~inMemoryStore,
          ~fieldName="user",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    marketRegisterEvent: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.MarketRegisterEvent),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        base_asset: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.MarketRegisterEvent),
          ~inMemoryStore,
          ~fieldName="base_asset",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        quote_asset: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.MarketRegisterEvent),
          ~inMemoryStore,
          ~fieldName="quote_asset",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        tx_id: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.MarketRegisterEvent),
          ~inMemoryStore,
          ~fieldName="tx_id",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    openOrderEvent: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.OpenOrderEvent),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        market: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.OpenOrderEvent),
          ~inMemoryStore,
          ~fieldName="market",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        order_id: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.OpenOrderEvent),
          ~inMemoryStore,
          ~fieldName="order_id",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        user: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.OpenOrderEvent),
          ~inMemoryStore,
          ~fieldName="user",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    order: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.Order),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        asset: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.Order),
          ~inMemoryStore,
          ~fieldName="asset",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        market: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.Order),
          ~inMemoryStore,
          ~fieldName="market",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        order_type: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.Order),
          ~inMemoryStore,
          ~fieldName="order_type",
          ~fieldValueSchema=Enums.OrderType.schema,
          ~logger,
        ),
      
        price: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.Order),
          ~inMemoryStore,
          ~fieldName="price",
          ~fieldValueSchema=BigInt.schema,
          ~logger,
        ),
      
        status: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.Order),
          ~inMemoryStore,
          ~fieldName="status",
          ~fieldValueSchema=Enums.OrderStatus.schema,
          ~logger,
        ),
      
        user: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.Order),
          ~inMemoryStore,
          ~fieldName="user",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    tradeOrderEvent: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.TradeOrderEvent),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        buy_order_id: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.TradeOrderEvent),
          ~inMemoryStore,
          ~fieldName="buy_order_id",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        buyer: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.TradeOrderEvent),
          ~inMemoryStore,
          ~fieldName="buyer",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        market: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.TradeOrderEvent),
          ~inMemoryStore,
          ~fieldName="market",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        sell_order_id: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.TradeOrderEvent),
          ~inMemoryStore,
          ~fieldName="sell_order_id",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        seller: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.TradeOrderEvent),
          ~inMemoryStore,
          ~fieldName="seller",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        seller_is_maker: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.TradeOrderEvent),
          ~inMemoryStore,
          ~fieldName="seller_is_maker",
          ~fieldValueSchema=S.bool,
          ~logger,
        ),
      
        trade_price: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.TradeOrderEvent),
          ~inMemoryStore,
          ~fieldName="trade_price",
          ~fieldValueSchema=BigInt.schema,
          ~logger,
        ),
      
        trade_size: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.TradeOrderEvent),
          ~inMemoryStore,
          ~fieldName="trade_size",
          ~fieldValueSchema=BigInt.schema,
          ~logger,
        ),
      
      },
    },
    withdrawEvent: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.WithdrawEvent),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        asset: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.WithdrawEvent),
          ~inMemoryStore,
          ~fieldName="asset",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        market: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.WithdrawEvent),
          ~inMemoryStore,
          ~fieldName="market",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        user: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.WithdrawEvent),
          ~inMemoryStore,
          ~fieldName="user",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    withdrawToMarketEvent: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.WithdrawToMarketEvent),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        asset: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.WithdrawToMarketEvent),
          ~inMemoryStore,
          ~fieldName="asset",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        market: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.WithdrawToMarketEvent),
          ~inMemoryStore,
          ~fieldName="market",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        to_market: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.WithdrawToMarketEvent),
          ~inMemoryStore,
          ~fieldName="to_market",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        user: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.WithdrawToMarketEvent),
          ~inMemoryStore,
          ~fieldName="user",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
  }
}

let getHandlerContext = (
  context,
  ~inMemoryStore: InMemoryStore.t,
  ~loadLayer,
  ~isInReorgThreshold,
) => {
  let {eventBatchQueueItem, logger} = context

  let eventIdentifier = eventBatchQueueItem->makeEventIdentifier
  {
    log: logger->getUserLogger,
    activeBuyOrder: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.ActiveBuyOrder),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~isInReorgThreshold,
    ),
    activeSellOrder: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.ActiveSellOrder),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~isInReorgThreshold,
    ),
    balance: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.Balance),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~isInReorgThreshold,
    ),
    cancelOrderEvent: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.CancelOrderEvent),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~isInReorgThreshold,
    ),
    depositEvent: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.DepositEvent),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~isInReorgThreshold,
    ),
    depositForEvent: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.DepositForEvent),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~isInReorgThreshold,
    ),
    marketRegisterEvent: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.MarketRegisterEvent),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~isInReorgThreshold,
    ),
    openOrderEvent: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.OpenOrderEvent),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~isInReorgThreshold,
    ),
    order: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.Order),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~isInReorgThreshold,
    ),
    tradeOrderEvent: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.TradeOrderEvent),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~isInReorgThreshold,
    ),
    withdrawEvent: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.WithdrawEvent),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~isInReorgThreshold,
    ),
    withdrawToMarketEvent: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.WithdrawToMarketEvent),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~isInReorgThreshold,
    ),
  }
}

let getContractRegisterArgs = (contextEnv, ~inMemoryStore) => {
  Types.HandlerTypes.event: contextEnv.eventBatchQueueItem.event,
  context: contextEnv->getContractRegisterContext(~inMemoryStore),
}

let getLoaderArgs = (contextEnv, ~inMemoryStore, ~loadLayer) => {
  Types.HandlerTypes.event: contextEnv.eventBatchQueueItem.event,
  context: contextEnv->getLoaderContext(~inMemoryStore, ~loadLayer),
}

let getHandlerArgs = (
  contextEnv,
  ~inMemoryStore,
  ~loaderReturn,
  ~loadLayer,
  ~isInReorgThreshold,
) => {
  Types.HandlerTypes.event: contextEnv.eventBatchQueueItem.event,
  context: contextEnv->getHandlerContext(~inMemoryStore, ~loadLayer, ~isInReorgThreshold),
  loaderReturn,
}
