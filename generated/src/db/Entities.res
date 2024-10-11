open Table
open Enums.EntityType
type id = string

type internalEntity
module type Entity = {
  type t
  let key: string
  let name: Enums.EntityType.t
  let schema: S.schema<t>
  let rowsSchema: S.schema<array<t>>
  let table: Table.table
}
module type InternalEntity = Entity with type t = internalEntity
external entityModToInternal: module(Entity with type t = 'a) => module(InternalEntity) = "%identity"

//shorthand for punning
let isPrimaryKey = true
let isNullable = true
let isArray = true
let isIndex = true

@genType
type whereOperations<'entity, 'fieldType> = {eq: 'fieldType => promise<array<'entity>>}

module ActiveBuyOrder = {
  let key = "ActiveBuyOrder"
  let name = ActiveBuyOrder
  @genType
  type t = {
    amount: bigint,
    asset: string,
    id: id,
    initial_amount: bigint,
    market: string,
    order_type: Enums.OrderType.t,
    price: bigint,
    status: Enums.OrderStatus.t,
    timestamp: string,
    user: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    asset: s.field("asset", S.string),
    id: s.field("id", S.string),
    initial_amount: s.field("initial_amount", BigInt.schema),
    market: s.field("market", S.string),
    order_type: s.field("order_type", Enums.OrderType.schema),
    price: s.field("price", BigInt.schema),
    status: s.field("status", Enums.OrderStatus.schema),
    timestamp: s.field("timestamp", S.string),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("asset") asset: whereOperations<t, string>,
    
      @as("market") market: whereOperations<t, string>,
    
      @as("order_type") order_type: whereOperations<t, Enums.OrderType.t>,
    
      @as("price") price: whereOperations<t, bigint>,
    
      @as("status") status: whereOperations<t, Enums.OrderStatus.t>,
    
      @as("user") user: whereOperations<t, string>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "asset", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "initial_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "market", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "order_type", 
      Custom(Enums.OrderType.enum.name),
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "price", 
      Numeric,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "status", 
      Custom(Enums.OrderStatus.enum.name),
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "timestamp", 
      Text,
      
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )
}
 
module ActiveSellOrder = {
  let key = "ActiveSellOrder"
  let name = ActiveSellOrder
  @genType
  type t = {
    amount: bigint,
    asset: string,
    id: id,
    initial_amount: bigint,
    market: string,
    order_type: Enums.OrderType.t,
    price: bigint,
    status: Enums.OrderStatus.t,
    timestamp: string,
    user: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    asset: s.field("asset", S.string),
    id: s.field("id", S.string),
    initial_amount: s.field("initial_amount", BigInt.schema),
    market: s.field("market", S.string),
    order_type: s.field("order_type", Enums.OrderType.schema),
    price: s.field("price", BigInt.schema),
    status: s.field("status", Enums.OrderStatus.schema),
    timestamp: s.field("timestamp", S.string),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("asset") asset: whereOperations<t, string>,
    
      @as("market") market: whereOperations<t, string>,
    
      @as("order_type") order_type: whereOperations<t, Enums.OrderType.t>,
    
      @as("price") price: whereOperations<t, bigint>,
    
      @as("status") status: whereOperations<t, Enums.OrderStatus.t>,
    
      @as("user") user: whereOperations<t, string>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "asset", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "initial_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "market", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "order_type", 
      Custom(Enums.OrderType.enum.name),
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "price", 
      Numeric,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "status", 
      Custom(Enums.OrderStatus.enum.name),
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "timestamp", 
      Text,
      
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )
}
 
module Balance = {
  let key = "Balance"
  let name = Balance
  @genType
  type t = {
    base_amount: bigint,
    id: id,
    market: string,
    quote_amount: bigint,
    timestamp: string,
    user: string,
  }

  let schema = S.object((s): t => {
    base_amount: s.field("base_amount", BigInt.schema),
    id: s.field("id", S.string),
    market: s.field("market", S.string),
    quote_amount: s.field("quote_amount", BigInt.schema),
    timestamp: s.field("timestamp", S.string),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("market") market: whereOperations<t, string>,
    
      @as("user") user: whereOperations<t, string>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "base_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "market", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "quote_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Text,
      
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )
}
 
module CancelOrderEvent = {
  let key = "CancelOrderEvent"
  let name = CancelOrderEvent
  @genType
  type t = {
    base_amount: bigint,
    id: id,
    market: string,
    order_id: string,
    quote_amount: bigint,
    timestamp: string,
    user: string,
  }

  let schema = S.object((s): t => {
    base_amount: s.field("base_amount", BigInt.schema),
    id: s.field("id", S.string),
    market: s.field("market", S.string),
    order_id: s.field("order_id", S.string),
    quote_amount: s.field("quote_amount", BigInt.schema),
    timestamp: s.field("timestamp", S.string),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("market") market: whereOperations<t, string>,
    
      @as("order_id") order_id: whereOperations<t, string>,
    
      @as("user") user: whereOperations<t, string>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "base_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "market", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "order_id", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "quote_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Text,
      
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )
}
 
module DepositEvent = {
  let key = "DepositEvent"
  let name = DepositEvent
  @genType
  type t = {
    amount: bigint,
    asset: string,
    base_amount: bigint,
    id: id,
    market: string,
    quote_amount: bigint,
    timestamp: string,
    user: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    asset: s.field("asset", S.string),
    base_amount: s.field("base_amount", BigInt.schema),
    id: s.field("id", S.string),
    market: s.field("market", S.string),
    quote_amount: s.field("quote_amount", BigInt.schema),
    timestamp: s.field("timestamp", S.string),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("asset") asset: whereOperations<t, string>,
    
      @as("market") market: whereOperations<t, string>,
    
      @as("user") user: whereOperations<t, string>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "asset", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "base_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "market", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "quote_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Text,
      
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )
}
 
module DepositForEvent = {
  let key = "DepositForEvent"
  let name = DepositForEvent
  @genType
  type t = {
    amount: bigint,
    asset: string,
    base_amount: bigint,
    caller: string,
    id: id,
    market: string,
    quote_amount: bigint,
    timestamp: string,
    user: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    asset: s.field("asset", S.string),
    base_amount: s.field("base_amount", BigInt.schema),
    caller: s.field("caller", S.string),
    id: s.field("id", S.string),
    market: s.field("market", S.string),
    quote_amount: s.field("quote_amount", BigInt.schema),
    timestamp: s.field("timestamp", S.string),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("asset") asset: whereOperations<t, string>,
    
      @as("caller") caller: whereOperations<t, string>,
    
      @as("market") market: whereOperations<t, string>,
    
      @as("user") user: whereOperations<t, string>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "asset", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "base_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "caller", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "market", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "quote_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Text,
      
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )
}
 
module MarketRegisterEvent = {
  let key = "MarketRegisterEvent"
  let name = MarketRegisterEvent
  @genType
  type t = {
    base_asset: string,
    id: id,
    quote_asset: string,
    timestamp: string,
    tx_id: string,
  }

  let schema = S.object((s): t => {
    base_asset: s.field("base_asset", S.string),
    id: s.field("id", S.string),
    quote_asset: s.field("quote_asset", S.string),
    timestamp: s.field("timestamp", S.string),
    tx_id: s.field("tx_id", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("base_asset") base_asset: whereOperations<t, string>,
    
      @as("quote_asset") quote_asset: whereOperations<t, string>,
    
      @as("tx_id") tx_id: whereOperations<t, string>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "base_asset", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "quote_asset", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "timestamp", 
      Text,
      
      
      
      
      
      ),
      mkField(
      "tx_id", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )
}
 
module OpenOrderEvent = {
  let key = "OpenOrderEvent"
  let name = OpenOrderEvent
  @genType
  type t = {
    amount: bigint,
    asset: string,
    base_amount: bigint,
    id: id,
    market: string,
    order_id: string,
    order_type: Enums.OrderType.t,
    price: bigint,
    quote_amount: bigint,
    timestamp: string,
    user: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    asset: s.field("asset", S.string),
    base_amount: s.field("base_amount", BigInt.schema),
    id: s.field("id", S.string),
    market: s.field("market", S.string),
    order_id: s.field("order_id", S.string),
    order_type: s.field("order_type", Enums.OrderType.schema),
    price: s.field("price", BigInt.schema),
    quote_amount: s.field("quote_amount", BigInt.schema),
    timestamp: s.field("timestamp", S.string),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("market") market: whereOperations<t, string>,
    
      @as("order_id") order_id: whereOperations<t, string>,
    
      @as("user") user: whereOperations<t, string>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "asset", 
      Text,
      
      
      
      
      
      ),
      mkField(
      "base_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "market", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "order_id", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "order_type", 
      Custom(Enums.OrderType.enum.name),
      
      
      
      
      
      ),
      mkField(
      "price", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "quote_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Text,
      
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )
}
 
module Order = {
  let key = "Order"
  let name = Order
  @genType
  type t = {
    amount: bigint,
    asset: string,
    id: id,
    initial_amount: bigint,
    market: string,
    order_type: Enums.OrderType.t,
    price: bigint,
    status: Enums.OrderStatus.t,
    timestamp: string,
    user: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    asset: s.field("asset", S.string),
    id: s.field("id", S.string),
    initial_amount: s.field("initial_amount", BigInt.schema),
    market: s.field("market", S.string),
    order_type: s.field("order_type", Enums.OrderType.schema),
    price: s.field("price", BigInt.schema),
    status: s.field("status", Enums.OrderStatus.schema),
    timestamp: s.field("timestamp", S.string),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("asset") asset: whereOperations<t, string>,
    
      @as("market") market: whereOperations<t, string>,
    
      @as("order_type") order_type: whereOperations<t, Enums.OrderType.t>,
    
      @as("price") price: whereOperations<t, bigint>,
    
      @as("status") status: whereOperations<t, Enums.OrderStatus.t>,
    
      @as("user") user: whereOperations<t, string>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "asset", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "initial_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "market", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "order_type", 
      Custom(Enums.OrderType.enum.name),
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "price", 
      Numeric,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "status", 
      Custom(Enums.OrderStatus.enum.name),
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "timestamp", 
      Text,
      
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )
}
 
module TradeOrderEvent = {
  let key = "TradeOrderEvent"
  let name = TradeOrderEvent
  @genType
  type t = {
    buy_order_id: string,
    buyer: string,
    buyer_base_amount: bigint,
    buyer_quote_amount: bigint,
    id: id,
    market: string,
    sell_order_id: string,
    seller: string,
    seller_base_amount: bigint,
    seller_quote_amount: bigint,
    timestamp: string,
    trade_price: bigint,
    trade_size: bigint,
  }

  let schema = S.object((s): t => {
    buy_order_id: s.field("buy_order_id", S.string),
    buyer: s.field("buyer", S.string),
    buyer_base_amount: s.field("buyer_base_amount", BigInt.schema),
    buyer_quote_amount: s.field("buyer_quote_amount", BigInt.schema),
    id: s.field("id", S.string),
    market: s.field("market", S.string),
    sell_order_id: s.field("sell_order_id", S.string),
    seller: s.field("seller", S.string),
    seller_base_amount: s.field("seller_base_amount", BigInt.schema),
    seller_quote_amount: s.field("seller_quote_amount", BigInt.schema),
    timestamp: s.field("timestamp", S.string),
    trade_price: s.field("trade_price", BigInt.schema),
    trade_size: s.field("trade_size", BigInt.schema),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("buy_order_id") buy_order_id: whereOperations<t, string>,
    
      @as("buyer") buyer: whereOperations<t, string>,
    
      @as("market") market: whereOperations<t, string>,
    
      @as("sell_order_id") sell_order_id: whereOperations<t, string>,
    
      @as("seller") seller: whereOperations<t, string>,
    
      @as("trade_price") trade_price: whereOperations<t, bigint>,
    
      @as("trade_size") trade_size: whereOperations<t, bigint>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "buy_order_id", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "buyer", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "buyer_base_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "buyer_quote_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "market", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "sell_order_id", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "seller", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "seller_base_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "seller_quote_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Text,
      
      
      
      
      
      ),
      mkField(
      "trade_price", 
      Numeric,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "trade_size", 
      Numeric,
      
      
      
      ~isIndex,
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )
}
 
module WithdrawEvent = {
  let key = "WithdrawEvent"
  let name = WithdrawEvent
  @genType
  type t = {
    amount: bigint,
    asset: string,
    base_amount: bigint,
    id: id,
    market: string,
    quote_amount: bigint,
    timestamp: string,
    user: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    asset: s.field("asset", S.string),
    base_amount: s.field("base_amount", BigInt.schema),
    id: s.field("id", S.string),
    market: s.field("market", S.string),
    quote_amount: s.field("quote_amount", BigInt.schema),
    timestamp: s.field("timestamp", S.string),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("asset") asset: whereOperations<t, string>,
    
      @as("market") market: whereOperations<t, string>,
    
      @as("user") user: whereOperations<t, string>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "asset", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "base_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "market", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "quote_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Text,
      
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )
}
 
module WithdrawToMarketEvent = {
  let key = "WithdrawToMarketEvent"
  let name = WithdrawToMarketEvent
  @genType
  type t = {
    amount: bigint,
    asset: string,
    base_amount: bigint,
    id: id,
    market: string,
    quote_amount: bigint,
    timestamp: string,
    to_market: string,
    user: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    asset: s.field("asset", S.string),
    base_amount: s.field("base_amount", BigInt.schema),
    id: s.field("id", S.string),
    market: s.field("market", S.string),
    quote_amount: s.field("quote_amount", BigInt.schema),
    timestamp: s.field("timestamp", S.string),
    to_market: s.field("to_market", S.string),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("asset") asset: whereOperations<t, string>,
    
      @as("market") market: whereOperations<t, string>,
    
      @as("to_market") to_market: whereOperations<t, string>,
    
      @as("user") user: whereOperations<t, string>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "asset", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "base_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "market", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "quote_amount", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Text,
      
      
      
      
      
      ),
      mkField(
      "to_market", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "user", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )
}
 

type entity = 
  | ActiveBuyOrder(ActiveBuyOrder.t)
  | ActiveSellOrder(ActiveSellOrder.t)
  | Balance(Balance.t)
  | CancelOrderEvent(CancelOrderEvent.t)
  | DepositEvent(DepositEvent.t)
  | DepositForEvent(DepositForEvent.t)
  | MarketRegisterEvent(MarketRegisterEvent.t)
  | OpenOrderEvent(OpenOrderEvent.t)
  | Order(Order.t)
  | TradeOrderEvent(TradeOrderEvent.t)
  | WithdrawEvent(WithdrawEvent.t)
  | WithdrawToMarketEvent(WithdrawToMarketEvent.t)

let makeGetter = (schema, accessor) => json => json->S.parseWith(schema)->Belt.Result.map(accessor)

let getEntityParamsDecoder = (entityName: Enums.EntityType.t) =>
  switch entityName {
  | ActiveBuyOrder => makeGetter(ActiveBuyOrder.schema, e => ActiveBuyOrder(e))
  | ActiveSellOrder => makeGetter(ActiveSellOrder.schema, e => ActiveSellOrder(e))
  | Balance => makeGetter(Balance.schema, e => Balance(e))
  | CancelOrderEvent => makeGetter(CancelOrderEvent.schema, e => CancelOrderEvent(e))
  | DepositEvent => makeGetter(DepositEvent.schema, e => DepositEvent(e))
  | DepositForEvent => makeGetter(DepositForEvent.schema, e => DepositForEvent(e))
  | MarketRegisterEvent => makeGetter(MarketRegisterEvent.schema, e => MarketRegisterEvent(e))
  | OpenOrderEvent => makeGetter(OpenOrderEvent.schema, e => OpenOrderEvent(e))
  | Order => makeGetter(Order.schema, e => Order(e))
  | TradeOrderEvent => makeGetter(TradeOrderEvent.schema, e => TradeOrderEvent(e))
  | WithdrawEvent => makeGetter(WithdrawEvent.schema, e => WithdrawEvent(e))
  | WithdrawToMarketEvent => makeGetter(WithdrawToMarketEvent.schema, e => WithdrawToMarketEvent(e))
  }

let allTables: array<table> = [
  ActiveBuyOrder.table,
  ActiveSellOrder.table,
  Balance.table,
  CancelOrderEvent.table,
  DepositEvent.table,
  DepositForEvent.table,
  MarketRegisterEvent.table,
  OpenOrderEvent.table,
  Order.table,
  TradeOrderEvent.table,
  WithdrawEvent.table,
  WithdrawToMarketEvent.table,
]
let schema = Schema.make(allTables)

@get
external getEntityId: internalEntity => string = "id"

exception UnexpectedIdNotDefinedOnEntity
let getEntityIdUnsafe = (entity: 'entity): id =>
  switch Utils.magic(entity)["id"] {
  | Some(id) => id
  | None =>
    UnexpectedIdNotDefinedOnEntity->ErrorHandling.mkLogAndRaise(
      ~msg="Property 'id' does not exist on expected entity object",
    )
  }
