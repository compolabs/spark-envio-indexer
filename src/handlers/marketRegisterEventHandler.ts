import { MarketRegistry } from "generated/src/Handlers.gen";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";
import { MarketRegisterEvent } from "generated";
import { registerDepositEventHandler } from "./depositEventHandler";

MarketRegistry.MarketRegisterEvent.handlerWithLoader(
  {

    loader: async ({
      event,
      context,
    }) => {
      const marketAddress = event.params.market.bits;
      context.contractRegistration.addOrderBook(marketAddress);

      return {
        market: marketAddress,
      };
    },

    handler: async ({
      event, context

    }) => {
      const marketRegisterEvent: MarketRegisterEvent = {
        id: nanoid(),
        base_asset: event.params.base.bits,
        quote_asset: event.params.quote.bits,
        market: event.params.market.bits,
        timestamp: getISOTime(event.block.time),
      };
      context.MarketRegisterEvent.set(marketRegisterEvent);
      
      const marketAddress = event.params.market.bits;

      // context.contractRegistration.addOrderBook(marketAddress);
    }
  }
);








// MarketRegistry_MarketRegisterEvent_handler(({ event, context }) => {
//  context.log.info(`Market registered: ${event.params.market}`);


//  registerDepositEventHandler(context.contractRegistration.getMarketContract(event.params.market));
// });
