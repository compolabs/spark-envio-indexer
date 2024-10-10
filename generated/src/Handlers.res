  @genType
module Market = {
  module DepositEvent = Types.MakeRegister(Types.Market.DepositEvent)
  module DepositForEvent = Types.MakeRegister(Types.Market.DepositForEvent)
  module WithdrawEvent = Types.MakeRegister(Types.Market.WithdrawEvent)
  module WithdrawToMarketEvent = Types.MakeRegister(Types.Market.WithdrawToMarketEvent)
  module OpenOrderEvent = Types.MakeRegister(Types.Market.OpenOrderEvent)
  module CancelOrderEvent = Types.MakeRegister(Types.Market.CancelOrderEvent)
  module TradeOrderEvent = Types.MakeRegister(Types.Market.TradeOrderEvent)
}

  @genType
module Registry = {
  module MarketRegisterEvent = Types.MakeRegister(Types.Registry.MarketRegisterEvent)
}

