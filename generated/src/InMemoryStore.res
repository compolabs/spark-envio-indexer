
@genType
type rawEventsKey = {
  chainId: int,
  eventId: string,
}

let hashRawEventsKey = (key: rawEventsKey) =>
  EventUtils.getEventIdKeyString(~chainId=key.chainId, ~eventId=key.eventId)

@genType
type dynamicContractRegistryKey = {
  chainId: int,
  contractAddress: Address.t,
}

let hashDynamicContractRegistryKey = ({chainId, contractAddress}) =>
  EventUtils.getContractAddressKeyString(~chainId, ~contractAddress)

type t = {
  eventSyncState: InMemoryTable.t<int, TablesStatic.EventSyncState.t>,
  rawEvents: InMemoryTable.t<rawEventsKey, TablesStatic.RawEvents.t>,
  dynamicContractRegistry: InMemoryTable.t<
    dynamicContractRegistryKey,
    TablesStatic.DynamicContractRegistry.t,
  >,
  @as("ActiveBuyOrder") 
  activeBuyOrder: InMemoryTable.Entity.t<Entities.ActiveBuyOrder.t>,
  @as("ActiveSellOrder") 
  activeSellOrder: InMemoryTable.Entity.t<Entities.ActiveSellOrder.t>,
  @as("Balance") 
  balance: InMemoryTable.Entity.t<Entities.Balance.t>,
  @as("CancelOrderEvent") 
  cancelOrderEvent: InMemoryTable.Entity.t<Entities.CancelOrderEvent.t>,
  @as("DepositEvent") 
  depositEvent: InMemoryTable.Entity.t<Entities.DepositEvent.t>,
  @as("DepositForEvent") 
  depositForEvent: InMemoryTable.Entity.t<Entities.DepositForEvent.t>,
  @as("MarketRegisterEvent") 
  marketRegisterEvent: InMemoryTable.Entity.t<Entities.MarketRegisterEvent.t>,
  @as("OpenOrderEvent") 
  openOrderEvent: InMemoryTable.Entity.t<Entities.OpenOrderEvent.t>,
  @as("Order") 
  order: InMemoryTable.Entity.t<Entities.Order.t>,
  @as("TradeOrderEvent") 
  tradeOrderEvent: InMemoryTable.Entity.t<Entities.TradeOrderEvent.t>,
  @as("WithdrawEvent") 
  withdrawEvent: InMemoryTable.Entity.t<Entities.WithdrawEvent.t>,
  @as("WithdrawToMarketEvent") 
  withdrawToMarketEvent: InMemoryTable.Entity.t<Entities.WithdrawToMarketEvent.t>,
  rollBackEventIdentifier: option<Types.eventIdentifier>,
}

let makeWithRollBackEventIdentifier = (rollBackEventIdentifier): t => {
  eventSyncState: InMemoryTable.make(~hash=v => v->Belt.Int.toString),
  rawEvents: InMemoryTable.make(~hash=hashRawEventsKey),
  dynamicContractRegistry: InMemoryTable.make(~hash=hashDynamicContractRegistryKey),
  activeBuyOrder: InMemoryTable.Entity.make(),
  activeSellOrder: InMemoryTable.Entity.make(),
  balance: InMemoryTable.Entity.make(),
  cancelOrderEvent: InMemoryTable.Entity.make(),
  depositEvent: InMemoryTable.Entity.make(),
  depositForEvent: InMemoryTable.Entity.make(),
  marketRegisterEvent: InMemoryTable.Entity.make(),
  openOrderEvent: InMemoryTable.Entity.make(),
  order: InMemoryTable.Entity.make(),
  tradeOrderEvent: InMemoryTable.Entity.make(),
  withdrawEvent: InMemoryTable.Entity.make(),
  withdrawToMarketEvent: InMemoryTable.Entity.make(),
  rollBackEventIdentifier,
}

let make = () => makeWithRollBackEventIdentifier(None)

let clone = (self: t) => {
  eventSyncState: self.eventSyncState->InMemoryTable.clone,
  rawEvents: self.rawEvents->InMemoryTable.clone,
  dynamicContractRegistry: self.dynamicContractRegistry->InMemoryTable.clone,
  activeBuyOrder: self.activeBuyOrder->InMemoryTable.Entity.clone,
  activeSellOrder: self.activeSellOrder->InMemoryTable.Entity.clone,
  balance: self.balance->InMemoryTable.Entity.clone,
  cancelOrderEvent: self.cancelOrderEvent->InMemoryTable.Entity.clone,
  depositEvent: self.depositEvent->InMemoryTable.Entity.clone,
  depositForEvent: self.depositForEvent->InMemoryTable.Entity.clone,
  marketRegisterEvent: self.marketRegisterEvent->InMemoryTable.Entity.clone,
  openOrderEvent: self.openOrderEvent->InMemoryTable.Entity.clone,
  order: self.order->InMemoryTable.Entity.clone,
  tradeOrderEvent: self.tradeOrderEvent->InMemoryTable.Entity.clone,
  withdrawEvent: self.withdrawEvent->InMemoryTable.Entity.clone,
  withdrawToMarketEvent: self.withdrawToMarketEvent->InMemoryTable.Entity.clone,
  rollBackEventIdentifier: self.rollBackEventIdentifier->InMemoryTable.structuredClone,
}


let getInMemTable = (
  type entity,
  inMemoryStore: t,
  ~entityMod: module(Entities.Entity with type t = entity),
): InMemoryTable.Entity.t<entity> => {
  let module(Entity) = entityMod->Entities.entityModToInternal
  inMemoryStore->Utils.magic->Js.Dict.unsafeGet(Entity.key)
}
