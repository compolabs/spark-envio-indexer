import {
  OpenOrderEvent,
  Order,
  OrderBook
} from "generated";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";

OrderBook.OpenOrderEvent.handlerWithLoader(
  {
    loader: async ({
      event,
      context,
    }) => {
      return {
        balance: await context.Balance.get(getHash(`${event.params.user.payload.bits}-${event.srcAddress}`))
      }
    },

    handler: async ({
      event,
      context,
      loaderReturn
    }) => {
      const orderType = event.params.order_type.case;

      const openOrderEvent: OpenOrderEvent = {
        id: nanoid(),
        market: event.srcAddress,
        order_id: event.params.order_id,
        asset: event.params.asset.bits,
        amount: event.params.amount,
        order_type: orderType,
        price: event.params.price,
        user: event.params.user.payload.bits,
        base_amount: event.params.balance.liquid.base,
        quote_amount: event.params.balance.liquid.quote,
        tx_id: event.transaction.id,
        timestamp: getISOTime(event.block.time),
      };
      context.OpenOrderEvent.set(openOrderEvent);
      const balance = loaderReturn.balance;

      const order: Order = {
        ...openOrderEvent,
        id: event.params.order_id,
        initial_amount: event.params.amount,
        status: "Active",
      };
      context.Order.set(order);

      if (orderType === "Buy") {
        context.ActiveBuyOrder.set(order);
      } else if (orderType === "Sell") {
        context.ActiveSellOrder.set(order);
      }

      if (balance) {
        const updatedBalance = {
          ...balance,
          base_amount: event.params.balance.liquid.base,
          quote_amount: event.params.balance.liquid.quote,
          timestamp: getISOTime(event.block.time),
        };
        context.Balance.set(updatedBalance);
      } else {
        context.log.error(`Cannot find an balance ${event.params.user.payload.bits}`);
      }
    }
  }
)