import { Market, MockDb } from "generated/src/TestHelpers.gen";
import assert from "node:assert";
import { getHash } from "../src/utils";

const userAddress = "0x1ef4ca23f77ddd39400e32199f1e7e4a85dff2067a850ee0944ed6ece25c30fe";
const marketAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const asset = "0x38e4ca985b22625fff93205e997bfc5cc8453a953da638ad297ca60a9f2600bc";
const initialQuoteBalance = 1500n;

const initialAmount = 400n;
const depositAmount = 800n;
const afterDepositAmount = initialAmount + depositAmount;

const withdrawAmount = 1200n;
const afterWithdrawAmount = afterDepositAmount - withdrawAmount;

let sharedMockDb: any;

before(async () => {
  sharedMockDb = MockDb.createMockDb();
});
beforeEach(() => {
  const allBalances = sharedMockDb.entities.Balance.getAll();

  for (const balance of allBalances) {
    if (balance.base_amount < 0n) {
      throw new Error(`Test failed: balance for user ${balance.user} in market ${balance.market} is negative (${balance.base_amount})`);
    }
  }
});

describe("Event Handlers", () => {

  it("Processes a deposit event and updates the user's balance", async () => {
    const balanceId = getHash(`${userAddress}-${marketAddress}`);
    console.log("Expected Balance ID:", balanceId);

    // Создаем событие депозита
    const mockDepositEvent = Market.DepositEvent.mockData({
      user: {
        case: "Address",
        payload: {
          bits: userAddress,
        },
      },
      amount: depositAmount,
      asset: {
        bits: asset,
      },
      account: {
        liquid: {
          base: afterDepositAmount,
          quote: initialQuoteBalance,
        },
        locked: {
          base: 76n,
          quote: 45n,
        }
      }
    });

    sharedMockDb = await Market.DepositEvent.processEvent({
      event: mockDepositEvent,
      mockDb: sharedMockDb,
    });

    console.log("Generated Balance ID for Deposit:", balanceId);

    const allBalances = sharedMockDb.entities.Balance.getAll();
    console.log("All Balances in DB after Deposit Event:", allBalances);

    const actualBalance = sharedMockDb.entities.Balance.get(balanceId);
    assert(actualBalance, "Balance not found");

    assert.equal(actualBalance.base_amount, afterDepositAmount, "Base amount does not match the expected final balance");
  });

  it("Processes a withdraw event and updates the user's balance", async () => {
    const balanceId = getHash(`${userAddress}-${marketAddress}`);
    console.log("Expected Balance ID for Withdraw:", balanceId);

    const mockWithdrawEvent = Market.WithdrawEvent.mockData({
      user: {
        case: "Address",
        payload: {
          bits: userAddress,
        },
      },
      amount: withdrawAmount,
      asset: {
        bits: asset,
      },
      account: {
        liquid: {
          base: afterWithdrawAmount,
          quote: initialQuoteBalance,
        },
        locked: {
          base: 76n,
          quote: 45n,
        }
      }
    });

    sharedMockDb = await Market.WithdrawEvent.processEvent({
      event: mockWithdrawEvent,
      mockDb: sharedMockDb,
    });

    console.log("Generated Balance ID for Withdraw:", balanceId);

    const allBalances = sharedMockDb.entities.Balance.getAll();
    console.log("All Balances in DB after Withdraw Event:", allBalances);

    const actualBalance = sharedMockDb.entities.Balance.get(balanceId);
    assert(actualBalance, "Balance not found");

    assert(actualBalance.base_amount >= 0n, `Base amount is negative: ${actualBalance.base_amount}`);

    assert.equal(actualBalance.base_amount, afterWithdrawAmount, "Base amount does not match the expected balance after withdraw");
  });
});
