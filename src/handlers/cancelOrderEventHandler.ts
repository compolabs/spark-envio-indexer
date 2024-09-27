import {
  CancelOrderEvent,
  Order,
  Market
} from "generated";
import { OrderStatus_t } from "generated/src/db/Enums.gen";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from '../utils/getHash';

Market.CancelOrderEvent.handlerWithLoader(
  {
    loader: async ({
      event,
      context,
    }) => {
      return {
        balance: await context.Balance.get(getHash(`${event.params.user.payload.bits}-${event.srcAddress}`)),
        order: await context.Order.get(event.params.order_id)
      }
    },

    handler: async ({
      event,
      context,
      loaderReturn
    }) => {
      const cancelOrderEvent: CancelOrderEvent = {
        id: event.transaction.id,
        market: event.srcAddress,
        user: event.params.user.payload.bits,
        order_id: event.params.order_id,
        base_amount: event.params.balance.liquid.base,
        quote_amount: event.params.balance.liquid.quote,
        timestamp: getISOTime(event.block.time),
        // tx_id: event.transaction.id,
      };
      context.CancelOrderEvent.set(cancelOrderEvent);

      const order = loaderReturn.order;

      if (!order) {
        context.log.error(`Cannot find an order ${event.params.order_id}`);
        return;
      }

      const updatedOrder: Order = {
        ...order,
        amount: 0n,
        status: "Canceled" as OrderStatus_t,
        timestamp: getISOTime(event.block.time),
      };
      context.Order.set(updatedOrder);

      if (order.order_type === "Buy") {
        context.ActiveBuyOrder.deleteUnsafe(event.params.order_id);

      } else if (order.order_type === "Sell") {
        context.ActiveSellOrder.deleteUnsafe(event.params.order_id)
      }

      const balance = loaderReturn.balance;
      if (!balance) {
        context.log.error(`Cannot find an balance ${getHash(`${event.params.user.payload.bits}-${event.srcAddress}`)}`);
        return
      }

      const updatedBalance = {
        ...balance,
        base_amount: event.params.balance.liquid.base,
        quote_amount: event.params.balance.liquid.quote,
        timestamp: getISOTime(event.block.time),
      };

      context.Balance.set(updatedBalance);
    }
  }
)