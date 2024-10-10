@val external require: string => unit = "require"

let registerContractHandlers = (
  ~contractName,
  ~handlerPathRelativeToRoot,
  ~handlerPathRelativeToConfig,
) => {
  try {
    require("root/" ++ handlerPathRelativeToRoot)
  } catch {
  | exn =>
    let params = {
      "Contract Name": contractName,
      "Expected Handler Path": handlerPathRelativeToConfig,
      "Code": "EE500",
    }
    let logger = Logging.createChild(~params)

    let errHandler = exn->ErrorHandling.make(~msg="Failed to import handler file", ~logger)
    errHandler->ErrorHandling.log
    errHandler->ErrorHandling.raiseExn
  }
}

%%private(
  let makeGeneratedConfig = () => {
    let chains = [
      {
        let contracts = [
          {
            Config.name: "Registry",
            abi: Types.Registry.abi,
            addresses: [
              "0x194987ad2314d2de50646078ac1841f00b2dffda863a7d3dd421d220eb83d019"->Address.unsafeFromString
              ,
            ],
            events: [
              module(Types.Registry.MarketRegisterEvent),
            ],
            sighashes: [
              Types.Registry.MarketRegisterEvent.sighash,
            ],
          },
          {
            Config.name: "Market",
            abi: Types.Market.abi,
            addresses: [
            ],
            events: [
              module(Types.Market.DepositEvent),
              module(Types.Market.DepositForEvent),
              module(Types.Market.WithdrawEvent),
              module(Types.Market.WithdrawToMarketEvent),
              module(Types.Market.OpenOrderEvent),
              module(Types.Market.CancelOrderEvent),
              module(Types.Market.TradeOrderEvent),
            ],
            sighashes: [
              Types.Market.DepositEvent.sighash,
              Types.Market.DepositForEvent.sighash,
              Types.Market.WithdrawEvent.sighash,
              Types.Market.WithdrawToMarketEvent.sighash,
              Types.Market.OpenOrderEvent.sighash,
              Types.Market.CancelOrderEvent.sighash,
              Types.Market.TradeOrderEvent.sighash,
            ],
          },
        ]
        let chain = ChainMap.Chain.makeUnsafe(~chainId=0)
        {
          Config.confirmedBlockThreshold: 0,
          syncSource: 
            HyperFuel({endpointUrl: "https://fuel-testnet.hypersync.xyz"})
            ,
          startBlock: 0,
          endBlock:  None ,
          chain,
          contracts,
          chainWorker:
            module(HyperFuelWorker.Make({
              let chain = chain
              let endpointUrl = "https://fuel-testnet.hypersync.xyz"
              let contracts: array<Types.fuelContractConfig> = [
                {
                  name: "Registry",
                  events: [
                    Types.Registry.MarketRegisterEvent.register(),
                  ]
                },
                {
                  name: "Market",
                  events: [
                    Types.Market.DepositEvent.register(),
                    Types.Market.DepositForEvent.register(),
                    Types.Market.WithdrawEvent.register(),
                    Types.Market.WithdrawToMarketEvent.register(),
                    Types.Market.OpenOrderEvent.register(),
                    Types.Market.CancelOrderEvent.register(),
                    Types.Market.TradeOrderEvent.register(),
                  ]
                },
              ]
            }))
        }
      },
    ]

    Config.make(
      ~shouldRollbackOnReorg=false,
      ~shouldSaveFullHistory=false,
      ~isUnorderedMultichainMode=false,
      ~chains,
      ~enableRawEvents=false,
      ~entities=[
        module(Entities.ActiveBuyOrder),
        module(Entities.ActiveSellOrder),
        module(Entities.Balance),
        module(Entities.CancelOrderEvent),
        module(Entities.DepositEvent),
        module(Entities.DepositForEvent),
        module(Entities.MarketRegisterEvent),
        module(Entities.OpenOrderEvent),
        module(Entities.Order),
        module(Entities.TradeOrderEvent),
        module(Entities.WithdrawEvent),
        module(Entities.WithdrawToMarketEvent),
      ],
    )
  }

  let config: ref<option<Config.t>> = ref(None)
)

let registerAllHandlers = () => {
  registerContractHandlers(
    ~contractName="Market",
    ~handlerPathRelativeToRoot="src/OrderBookHandlers.ts",
    ~handlerPathRelativeToConfig="src/OrderBookHandlers.ts",
  )
  registerContractHandlers(
    ~contractName="Registry",
    ~handlerPathRelativeToRoot="src/OrderBookHandlers.ts",
    ~handlerPathRelativeToConfig="src/OrderBookHandlers.ts",
  )

  let generatedConfig = makeGeneratedConfig()
  config := Some(generatedConfig)
  generatedConfig
}

let getConfig = () => {
  switch config.contents {
  | Some(config) => config
  | None => registerAllHandlers()
  }
}
