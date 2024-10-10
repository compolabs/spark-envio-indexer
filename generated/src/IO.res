let executeSet = (
  sql: Postgres.sql,
  ~items: array<'a>,
  ~dbFunction: (Postgres.sql, array<'a>) => promise<unit>,
) => {
  if items->Array.length > 0 {
    sql->dbFunction(items)
  } else {
    Promise.resolve()
  }
}

let getEntityHistoryItems = (entityUpdates, ~entitySchema, ~entityType) => {
  let (_, entityHistoryItems) = entityUpdates->Belt.Array.reduce((None, []), (
    prev: (option<Types.eventIdentifier>, array<DbFunctions.entityHistoryItem>),
    entityUpdate: Types.entityUpdate<'a>,
  ) => {
    let (optPreviousEventIdentifier, entityHistoryItems) = prev

    let {eventIdentifier, shouldSaveHistory, entityUpdateAction, entityId} = entityUpdate
    let entityHistoryItems = if shouldSaveHistory {
      let mapPrev = Belt.Option.map(optPreviousEventIdentifier)
      let params = switch entityUpdateAction {
      | Set(entity) => Some(entity->S.serializeOrRaiseWith(entitySchema))

      | Delete => None
      }
      let historyItem: DbFunctions.entityHistoryItem = {
        chain_id: eventIdentifier.chainId,
        block_number: eventIdentifier.blockNumber,
        block_timestamp: eventIdentifier.blockTimestamp,
        log_index: eventIdentifier.logIndex,
        previous_chain_id: mapPrev(prev => prev.chainId),
        previous_block_timestamp: mapPrev(prev => prev.blockTimestamp),
        previous_block_number: mapPrev(prev => prev.blockNumber),
        previous_log_index: mapPrev(prev => prev.logIndex),
        entity_type: entityType,
        entity_id: entityId,
        params,
      }
      entityHistoryItems->Belt.Array.concat([historyItem])
    } else {
      entityHistoryItems
    }

    (Some(eventIdentifier), entityHistoryItems)
  })

  entityHistoryItems
}

let executeSetEntityWithHistory = (
  type entity,
  sql: Postgres.sql,
  ~rows: array<Types.inMemoryStoreRowEntity<entity>>,
  ~entityMod: module(Entities.Entity with type t = entity),
): promise<unit> => {
  let module(EntityMod) = entityMod
  let {schema, table} = module(EntityMod)
  let (entitiesToSet, idsToDelete, entityHistoryItemsToSet) = rows->Belt.Array.reduce(
    ([], [], []),
    ((entitiesToSet, idsToDelete, entityHistoryItemsToSet), row) => {
      switch row {
      | Updated({latest, history}) =>
        let entityHistoryItems =
          history
          ->Belt.Array.concat([latest])
          ->getEntityHistoryItems(~entitySchema=schema, ~entityType=table.tableName)

        switch latest.entityUpdateAction {
        | Set(entity) => (
            entitiesToSet->Belt.Array.concat([entity]),
            idsToDelete,
            entityHistoryItemsToSet->Belt.Array.concat([entityHistoryItems]),
          )
        | Delete => (
            entitiesToSet,
            idsToDelete->Belt.Array.concat([latest.entityId]),
            entityHistoryItemsToSet->Belt.Array.concat([entityHistoryItems]),
          )
        }
      | _ => (entitiesToSet, idsToDelete, entityHistoryItemsToSet)
      }
    },
  )

  [
    sql->DbFunctions.EntityHistory.batchSet(
      ~entityHistoriesToSet=Belt.Array.concatMany(entityHistoryItemsToSet),
    ),
    if entitiesToSet->Array.length > 0 {
      sql->DbFunctionsEntities.batchSet(~entityMod)(entitiesToSet)
    } else {
      Promise.resolve()
    },
    if idsToDelete->Array.length > 0 {
      sql->DbFunctionsEntities.batchDelete(~entityMod)(idsToDelete)
    } else {
      Promise.resolve()
    },
  ]
  ->Promise.all
  ->Promise.thenResolve(_ => ())
}

let executeDbFunctionsEntity = (
  type entity,
  sql: Postgres.sql,
  ~rows: array<Types.inMemoryStoreRowEntity<entity>>,
  ~entityMod: module(Entities.Entity with type t = entity),
): promise<unit> => {
  let (entitiesToSet, idsToDelete) = rows->Belt.Array.reduce(([], []), (
    (accumulatedSets, accumulatedDeletes),
    row,
  ) =>
    switch row {
    | Updated({latest: {entityUpdateAction: Set(entity)}}) => (
        Belt.Array.concat(accumulatedSets, [entity]),
        accumulatedDeletes,
      )
    | Updated({latest: {entityUpdateAction: Delete, entityId}}) => (
        accumulatedSets,
        Belt.Array.concat(accumulatedDeletes, [entityId]),
      )
    | _ => (accumulatedSets, accumulatedDeletes)
    }
  )

  let promises =
    (
      entitiesToSet->Array.length > 0 ? [sql->DbFunctionsEntities.batchSet(~entityMod)(entitiesToSet)] : []
    )->Belt.Array.concat(
      idsToDelete->Array.length > 0 ? [sql->DbFunctionsEntities.batchDelete(~entityMod)(idsToDelete)] : [],
    )

  promises->Promise.all->Promise.thenResolve(_ => ())
}

let executeBatch = async (sql, ~inMemoryStore: InMemoryStore.t, ~isInReorgThreshold) => {
  let entityDbExecutionComposer =
    RegisterHandlers.getConfig()->Config.shouldSaveHistory(~isInReorgThreshold)
      ? executeSetEntityWithHistory
      : executeDbFunctionsEntity

  let setEventSyncState = executeSet(
    _,
    ~dbFunction=DbFunctions.EventSyncState.batchSet,
    ~items=inMemoryStore.eventSyncState->InMemoryTable.values,
  )

  let setRawEvents = executeSet(
    _,
    ~dbFunction=DbFunctions.RawEvents.batchSet,
    ~items=inMemoryStore.rawEvents->InMemoryTable.values,
  )

  let setDynamicContracts = executeSet(
    _,
    ~dbFunction=DbFunctions.DynamicContractRegistry.batchSet,
    ~items=inMemoryStore.dynamicContractRegistry->InMemoryTable.values,
  )

  let setActiveBuyOrders = entityDbExecutionComposer(
    _,
    ~entityMod=module(Entities.ActiveBuyOrder),
    ~rows=inMemoryStore.activeBuyOrder->InMemoryTable.Entity.rows,
  )

  let setActiveSellOrders = entityDbExecutionComposer(
    _,
    ~entityMod=module(Entities.ActiveSellOrder),
    ~rows=inMemoryStore.activeSellOrder->InMemoryTable.Entity.rows,
  )

  let setBalances = entityDbExecutionComposer(
    _,
    ~entityMod=module(Entities.Balance),
    ~rows=inMemoryStore.balance->InMemoryTable.Entity.rows,
  )

  let setCancelOrderEvents = entityDbExecutionComposer(
    _,
    ~entityMod=module(Entities.CancelOrderEvent),
    ~rows=inMemoryStore.cancelOrderEvent->InMemoryTable.Entity.rows,
  )

  let setDepositEvents = entityDbExecutionComposer(
    _,
    ~entityMod=module(Entities.DepositEvent),
    ~rows=inMemoryStore.depositEvent->InMemoryTable.Entity.rows,
  )

  let setDepositForEvents = entityDbExecutionComposer(
    _,
    ~entityMod=module(Entities.DepositForEvent),
    ~rows=inMemoryStore.depositForEvent->InMemoryTable.Entity.rows,
  )

  let setMarketRegisterEvents = entityDbExecutionComposer(
    _,
    ~entityMod=module(Entities.MarketRegisterEvent),
    ~rows=inMemoryStore.marketRegisterEvent->InMemoryTable.Entity.rows,
  )

  let setOpenOrderEvents = entityDbExecutionComposer(
    _,
    ~entityMod=module(Entities.OpenOrderEvent),
    ~rows=inMemoryStore.openOrderEvent->InMemoryTable.Entity.rows,
  )

  let setOrders = entityDbExecutionComposer(
    _,
    ~entityMod=module(Entities.Order),
    ~rows=inMemoryStore.order->InMemoryTable.Entity.rows,
  )

  let setTradeOrderEvents = entityDbExecutionComposer(
    _,
    ~entityMod=module(Entities.TradeOrderEvent),
    ~rows=inMemoryStore.tradeOrderEvent->InMemoryTable.Entity.rows,
  )

  let setWithdrawEvents = entityDbExecutionComposer(
    _,
    ~entityMod=module(Entities.WithdrawEvent),
    ~rows=inMemoryStore.withdrawEvent->InMemoryTable.Entity.rows,
  )

  let setWithdrawToMarketEvents = entityDbExecutionComposer(
    _,
    ~entityMod=module(Entities.WithdrawToMarketEvent),
    ~rows=inMemoryStore.withdrawToMarketEvent->InMemoryTable.Entity.rows,
  )

  //In the event of a rollback, rollback all meta tables based on the given
  //valid event identifier, where all rows created after this eventIdentifier should
  //be deleted
  let rollbackTables = switch inMemoryStore.rollBackEventIdentifier {
  | Some(eventIdentifier) =>
    [
      DbFunctions.EntityHistory.deleteAllEntityHistoryAfterEventIdentifier,
      DbFunctions.RawEvents.deleteAllRawEventsAfterEventIdentifier,
      DbFunctions.DynamicContractRegistry.deleteAllDynamicContractRegistrationsAfterEventIdentifier,
    ]->Belt.Array.map(fn => fn(_, ~eventIdentifier))
  | None => []
  }

  let res = await sql->Postgres.beginSql(sql => {
    Belt.Array.concat(
      //Rollback tables need to happen first in the traction
      rollbackTables,
      [
        setEventSyncState,
        setRawEvents,
        setDynamicContracts,
        setActiveBuyOrders,
        setActiveSellOrders,
        setBalances,
        setCancelOrderEvents,
        setDepositEvents,
        setDepositForEvents,
        setMarketRegisterEvents,
        setOpenOrderEvents,
        setOrders,
        setTradeOrderEvents,
        setWithdrawEvents,
        setWithdrawToMarketEvents,
      ],
    )->Belt.Array.map(dbFunc => sql->dbFunc)
  })

  res
}

module RollBack = {
  exception DecodeError(S.error)
  let rollBack = async (~chainId, ~blockTimestamp, ~blockNumber, ~logIndex) => {
    let reorgData = switch await DbFunctions.sql->DbFunctions.EntityHistory.getRollbackDiff(
      ~chainId,
      ~blockTimestamp,
      ~blockNumber,
    ) {
    | Ok(v) => v
    | Error(exn) =>
      exn
      ->DecodeError
      ->ErrorHandling.mkLogAndRaise(~msg="Failed to get rollback diff from entity history")
    }

    let rollBackEventIdentifier: Types.eventIdentifier = {
      chainId,
      blockTimestamp,
      blockNumber,
      logIndex,
    }

    let inMemStore = InMemoryStore.makeWithRollBackEventIdentifier(Some(rollBackEventIdentifier))

    //Don't save the rollback diffs to history table
    let shouldSaveHistory = false

    reorgData->Belt.Array.forEach(e => {
      switch e {
      //Where previousEntity is Some, 
      //set the value with the eventIdentifier that set that value initially
      | {previousEntity: Some({entity: ActiveBuyOrder(entity), eventIdentifier}), entityId} =>
        inMemStore.activeBuyOrder->InMemoryTable.Entity.set(
          Set(entity)->Types.mkEntityUpdate(~eventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: Some({entity: ActiveSellOrder(entity), eventIdentifier}), entityId} =>
        inMemStore.activeSellOrder->InMemoryTable.Entity.set(
          Set(entity)->Types.mkEntityUpdate(~eventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: Some({entity: Balance(entity), eventIdentifier}), entityId} =>
        inMemStore.balance->InMemoryTable.Entity.set(
          Set(entity)->Types.mkEntityUpdate(~eventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: Some({entity: CancelOrderEvent(entity), eventIdentifier}), entityId} =>
        inMemStore.cancelOrderEvent->InMemoryTable.Entity.set(
          Set(entity)->Types.mkEntityUpdate(~eventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: Some({entity: DepositEvent(entity), eventIdentifier}), entityId} =>
        inMemStore.depositEvent->InMemoryTable.Entity.set(
          Set(entity)->Types.mkEntityUpdate(~eventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: Some({entity: DepositForEvent(entity), eventIdentifier}), entityId} =>
        inMemStore.depositForEvent->InMemoryTable.Entity.set(
          Set(entity)->Types.mkEntityUpdate(~eventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: Some({entity: MarketRegisterEvent(entity), eventIdentifier}), entityId} =>
        inMemStore.marketRegisterEvent->InMemoryTable.Entity.set(
          Set(entity)->Types.mkEntityUpdate(~eventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: Some({entity: OpenOrderEvent(entity), eventIdentifier}), entityId} =>
        inMemStore.openOrderEvent->InMemoryTable.Entity.set(
          Set(entity)->Types.mkEntityUpdate(~eventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: Some({entity: Order(entity), eventIdentifier}), entityId} =>
        inMemStore.order->InMemoryTable.Entity.set(
          Set(entity)->Types.mkEntityUpdate(~eventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: Some({entity: TradeOrderEvent(entity), eventIdentifier}), entityId} =>
        inMemStore.tradeOrderEvent->InMemoryTable.Entity.set(
          Set(entity)->Types.mkEntityUpdate(~eventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: Some({entity: WithdrawEvent(entity), eventIdentifier}), entityId} =>
        inMemStore.withdrawEvent->InMemoryTable.Entity.set(
          Set(entity)->Types.mkEntityUpdate(~eventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: Some({entity: WithdrawToMarketEvent(entity), eventIdentifier}), entityId} =>
        inMemStore.withdrawToMarketEvent->InMemoryTable.Entity.set(
          Set(entity)->Types.mkEntityUpdate(~eventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      //Where previousEntity is None, 
      //delete it with the eventIdentifier of the rollback event
      | {previousEntity: None, entityType: ActiveBuyOrder, entityId} =>
        inMemStore.activeBuyOrder->InMemoryTable.Entity.set(
          Delete->Types.mkEntityUpdate(~eventIdentifier=rollBackEventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: None, entityType: ActiveSellOrder, entityId} =>
        inMemStore.activeSellOrder->InMemoryTable.Entity.set(
          Delete->Types.mkEntityUpdate(~eventIdentifier=rollBackEventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: None, entityType: Balance, entityId} =>
        inMemStore.balance->InMemoryTable.Entity.set(
          Delete->Types.mkEntityUpdate(~eventIdentifier=rollBackEventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: None, entityType: CancelOrderEvent, entityId} =>
        inMemStore.cancelOrderEvent->InMemoryTable.Entity.set(
          Delete->Types.mkEntityUpdate(~eventIdentifier=rollBackEventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: None, entityType: DepositEvent, entityId} =>
        inMemStore.depositEvent->InMemoryTable.Entity.set(
          Delete->Types.mkEntityUpdate(~eventIdentifier=rollBackEventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: None, entityType: DepositForEvent, entityId} =>
        inMemStore.depositForEvent->InMemoryTable.Entity.set(
          Delete->Types.mkEntityUpdate(~eventIdentifier=rollBackEventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: None, entityType: MarketRegisterEvent, entityId} =>
        inMemStore.marketRegisterEvent->InMemoryTable.Entity.set(
          Delete->Types.mkEntityUpdate(~eventIdentifier=rollBackEventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: None, entityType: OpenOrderEvent, entityId} =>
        inMemStore.openOrderEvent->InMemoryTable.Entity.set(
          Delete->Types.mkEntityUpdate(~eventIdentifier=rollBackEventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: None, entityType: Order, entityId} =>
        inMemStore.order->InMemoryTable.Entity.set(
          Delete->Types.mkEntityUpdate(~eventIdentifier=rollBackEventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: None, entityType: TradeOrderEvent, entityId} =>
        inMemStore.tradeOrderEvent->InMemoryTable.Entity.set(
          Delete->Types.mkEntityUpdate(~eventIdentifier=rollBackEventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: None, entityType: WithdrawEvent, entityId} =>
        inMemStore.withdrawEvent->InMemoryTable.Entity.set(
          Delete->Types.mkEntityUpdate(~eventIdentifier=rollBackEventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      | {previousEntity: None, entityType: WithdrawToMarketEvent, entityId} =>
        inMemStore.withdrawToMarketEvent->InMemoryTable.Entity.set(
          Delete->Types.mkEntityUpdate(~eventIdentifier=rollBackEventIdentifier, ~entityId, ~shouldSaveHistory),
          ~shouldSaveHistory,
        )
      }
    })

    inMemStore
  }
}
