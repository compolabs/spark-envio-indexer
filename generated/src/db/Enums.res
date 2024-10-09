// Graphql Enum Type Variants
type enumType<'a> = {
  name: string,
  variants: array<'a>,
}

let mkEnum = (~name, ~variants) => {
  name,
  variants,
}

module type Enum = {
  type t
  let enum: enumType<t>
}

module ContractType = {
  @genType
  type t = 
    | @as("Market") Market
    | @as("Registry") Registry

  let schema = S.enum([
    Market, 
    Registry, 
  ])

  let name = "CONTRACT_TYPE"
  let variants = [
    Market,
    Registry,
  ]
  let enum = mkEnum(~name, ~variants)
}

module EntityType = {
  @genType
  type t = 
    | @as("ActiveBuyOrder") ActiveBuyOrder
    | @as("ActiveSellOrder") ActiveSellOrder
    | @as("Balance") Balance
    | @as("CancelOrderEvent") CancelOrderEvent
    | @as("DepositEvent") DepositEvent
    | @as("DepositForEvent") DepositForEvent
    | @as("MarketRegisterEvent") MarketRegisterEvent
    | @as("OpenOrderEvent") OpenOrderEvent
    | @as("Order") Order
    | @as("TradeOrderEvent") TradeOrderEvent
    | @as("WithdrawEvent") WithdrawEvent
    | @as("WithdrawToMarketEvent") WithdrawToMarketEvent

  let schema = S.enum([
    ActiveBuyOrder, 
    ActiveSellOrder, 
    Balance, 
    CancelOrderEvent, 
    DepositEvent, 
    DepositForEvent, 
    MarketRegisterEvent, 
    OpenOrderEvent, 
    Order, 
    TradeOrderEvent, 
    WithdrawEvent, 
    WithdrawToMarketEvent, 
  ])

  let name = "ENTITY_TYPE"
  let variants = [
    ActiveBuyOrder,
    ActiveSellOrder,
    Balance,
    CancelOrderEvent,
    DepositEvent,
    DepositForEvent,
    MarketRegisterEvent,
    OpenOrderEvent,
    Order,
    TradeOrderEvent,
    WithdrawEvent,
    WithdrawToMarketEvent,
  ]

  let enum = mkEnum(~name, ~variants)
}

module OrderStatus = {
  @genType
  type t = 
    | @as("Active") Active
    | @as("Closed") Closed
    | @as("Canceled") Canceled


  let default = Active
  let schema: S.t<t> = S.enum([
    Active, 
    Closed, 
    Canceled, 
  ])

  let name = "OrderStatus"
  let variants = [
    Active,
    Closed,
    Canceled,
  ]
  let enum = mkEnum(~name, ~variants)
  }
module OrderType = {
  @genType
  type t = 
    | @as("Sell") Sell
    | @as("Buy") Buy


  let default = Sell
  let schema: S.t<t> = S.enum([
    Sell, 
    Buy, 
  ])

  let name = "OrderType"
  let variants = [
    Sell,
    Buy,
  ]
  let enum = mkEnum(~name, ~variants)
  }

let allEnums: array<module(Enum)> = [
  module(ContractType), 
  module(EntityType),
  module(OrderStatus),
  module(OrderType),
]
