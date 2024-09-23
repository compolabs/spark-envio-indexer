import {
  OpenOrderEvent,
  Order,
  OrderBook
} from "generated";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";

OrderBook.OpenOrderEvent.handlerWithLoader(
  {
    loader: async ({
      event,
      context,
    }) => {
      return {
        balance: await context.Balance.get(event.params.user.payload.bits)
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
        order_id: event.params.order_id,
        asset: event.params.asset.bits,
        amount: event.params.amount,
        order_type: orderType,
        price: event.params.price,
        user: event.params.user.payload.bits,
        base_amount: event.params.liquid_base,
        quote_amount: event.params.liquid_quote,
        tx_id: event.transaction.id,
        timestamp: getISOTime(event.block.time),
      };
      context.OpenOrderEvent.set(openOrderEvent);

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

      const balance = loaderReturn.balance;
      if (!balance) {
        context.log.error(`Cannot find an balance ${event.params.user.payload.bits}`);
        return
      }
      const updatedBalance = {
        ...balance,
        base_amount: event.params.liquid_base,
        quote_amount: event.params.liquid_quote,
        timestamp: getISOTime(event.block.time),
      };

      context.Balance.set(updatedBalance);

    }
  }
)