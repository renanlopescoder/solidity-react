import { ether, tokens, EVM_REVERT, ETHER_ADDRESS } from "./helpers";

const Token = artifacts.require("./Token");
const Exchange = artifacts.require("./Exchange");

require("chai").use(require("chai-as-promised")).should();

contract("Exchange", ([deployerAccount, feeAccount, user1, user2]) => {
  let exchange, token;
  const feePercent = 1;

  beforeEach(async () => {
    // Deploy token
    token = await Token.new();
    // Transfer tokens from the deployer account to user1
    token.transfer(user1, tokens(100), { from: deployerAccount });

    // Deploy exchange
    exchange = await Exchange.new(feeAccount, feePercent);
  });

  describe("Deployment", () => {
    it("Tracks the fee account", async () => {
      const result = await exchange.feeAccount();
      String(result).should.equal(String(feeAccount));
    });

    it("Tracks the fee percent", async () => {
      const result = await exchange.feePercent();
      String(result).should.equal(String(feePercent));
    });
  });

  describe("Fallback", () => {
    it("Reverts when Ether is sent", async () => {
      await exchange
        .sendTransaction({ value: ether(1), from: user1 })
        .should.be.rejectedWith(EVM_REVERT);
    });
  });

  describe("Depositing Ether", () => {
    let result;

    beforeEach(async () => {
      result = await exchange.depositEther({
        from: user1,
        value: ether(1),
      });
    });

    it("Tracks the Ether deposit", async () => {
      const balance = await exchange.tokens(ETHER_ADDRESS, user1);
      String(balance).should.equal(String(ether(1)));
    });

    it("Emits a Deposit event", () => {
      const log = result.logs[0];
      log.event.should.eq("Deposit");
      const event = log.args;
      String(event.token).should.equal(
        ETHER_ADDRESS,
        "Ether address is correct"
      );
      String(event.user).should.equal(user1, "User address is correct");
      String(event.amount).should.equal(String(ether(1)), "Amount is correct");
      String(event.balance).should.equal(
        String(ether(1)),
        "Contract balance is correct"
      );
    });
  });

  describe("Withdrawing Ether", () => {
    let result;

    beforeEach(async () => {
      // Make the ether deposit to the contract
      await exchange.depositEther({ from: user1, value: ether(1) });
    });

    describe("Success", () => {
      beforeEach(async () => {
        // Perform Withdraw
        result = await exchange.withdrawEther(ether(1), { from: user1 });
      });

      it("Withdraws Ether funds", async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1);
        String(balance).should.equal("0");
      });

      it("Emits a Withdraw event", () => {
        const log = result.logs[0];
        log.event.should.eq("Withdraw");
        const event = log.args;
        String(event.token).should.equal(
          ETHER_ADDRESS,
          "Ether address is correct"
        );
        String(event.user).should.equal(user1, "User address is correct");
        String(event.amount).should.equal(
          String(ether(1)),
          "Amount is correct"
        );
        String(event.balance).should.equal("0", "Contract balance is correct");
      });
    });

    describe("Failure", () => {
      it("Rejects withdraws for insufficient balances", async () => {
        await exchange
          .withdrawEther(ether(100), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("Depositing tokens", () => {
    let result;
    const amount = tokens(10);

    describe("Success", () => {
      beforeEach(async () => {
        await token.approve(exchange.address, amount, { from: user1 });
        result = await exchange.depositToken(token.address, amount, {
          from: user1,
        });
      });

      it("Tracks the token deposit", async () => {
        let balance = await token.balanceOf(exchange.address);
        String(balance).should.equal(
          String(amount),
          "Check exchange token balance"
        );

        balance = await exchange.tokens(token.address, user1);
        String(balance).should.equal(
          String(amount),
          "Check tokens on exchange"
        );
      });

      it("Emits a Deposit event", async () => {
        const log = result.logs[0];
        log.event.should.eq("Deposit");
        const event = log.args;
        String(event.token).should.equal(
          token.address,
          "Token address is correct"
        );
        String(event.user).should.equal(user1, "User address is correct");
        String(event.amount).should.equal(
          String(tokens(10)),
          "Amount is correct"
        );
        String(event.balance).should.equal(
          String(tokens(10)),
          "Balance is correct"
        );
      });
    });

    describe("Failure", () => {
      if (
        ("Rejects Ether deposits on deposit tokens",
        async () => {
          // TODO
          await exchange
            .depositToken(ETHER_ADDRESS, tokens(10), { from: user1 })
            .should.be.rejectedWith(EVM_REVERT);
        })
      )
        it("Fails deposit when no tokens are approved", async () => {
          result = await exchange
            .depositToken(token.address, tokens(10), {
              from: user1,
            })
            .should.be.rejectedWith(EVM_REVERT);
        });
    });
  });

  describe("Withdrawing tokens", () => {
    let result;

    describe("Success", () => {
      beforeEach(async () => {
        // Approve and Deposit tokens first
        await token.approve(exchange.address, tokens(10), { from: user1 });
        await exchange.depositToken(token.address, tokens(10), {
          from: user1,
        });

        // Withdraw Amount of tokens
        result = await exchange.withdrawToken(token.address, tokens(10), {
          from: user1,
        });
      });

      it("Withdraws token funds", async () => {
        const balance = await exchange.tokens(token.address, user1);
        String(balance).should.equal("0");
      });

      it("Emits a Withdraw event", () => {
        const log = result.logs[0];
        log.event.should.eq("Withdraw");
        const event = log.args;
        event.token.should.equal(token.address);
        event.user.should.equal(user1);
        String(event.amount).should.equal(String(tokens(10)));
        String(event.balance).should.equal("0");
      });
    });

    describe("Failure", () => {
      it("Rejects Ether withdraws on tokens function", async () => {
        await exchange
          .withdrawToken(ETHER_ADDRESS, tokens(10), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("Fails for insufficient balances", async () => {
        // Attempt to withdraw tokens without depositing any first
        await exchange
          .withdrawToken(token.address, tokens(10), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("Checking balances", () => {
    beforeEach(async () => {
      await exchange.depositEther({ from: user1, value: ether(1) });
    });

    it("Returns user balance", async () => {
      const result = await exchange.balanceOf(ETHER_ADDRESS, user1);
      String(result).should.equal(String(ether(1)));
    });
  });

  describe("Making orders", () => {
    let result;

    beforeEach(async () => {
      result = await exchange.makeOrder(
        token.address,
        tokens(1),
        ETHER_ADDRESS,
        ether(1),
        { from: user1 }
      );
    });

    it("Tracks the newly created order", async () => {
      const orderCount = await exchange.orderCount();
      String(orderCount).should.equal("1");
      const order = await exchange.orders("1");
      String(order.id).should.equal("1", "Order id is correct");
      order.user.should.equal(user1, "user is correct");
      order.tokenGet.should.equal(token.address, "tokenGet is correct");
      String(order.amountGet).should.equal(
        String(tokens(1)),
        "amountGet is correct"
      );
      order.tokenGive.should.equal(ETHER_ADDRESS, "tokenGive is correct");
      String(order.amountGive).should.equal(
        String(ether(1)),
        "amountGive is correct"
      );
      String(order.timestamp).length.should.be.at.least(
        1,
        "timestamp is present"
      );
    });

    it("Emits an Order event", () => {
      const log = result.logs[0];
      log.event.should.eq("Order");
      const event = log.args;
      String(event.id).should.equal("1", "Order id is correct");
      event.user.should.equal(user1, "user is correct");
      event.tokenGet.should.equal(token.address, "tokenGet is correct");
      String(event.amountGet).should.equal(
        String(tokens(1)),
        "amountGet is correct"
      );
      event.tokenGive.should.equal(ETHER_ADDRESS, "tokenGive is correct");
      String(event.amountGive).should.equal(
        String(ether(1)),
        "amountGive is correct"
      );
      String(event.timestamp).length.should.be.at.least(
        1,
        "timestamp is present"
      );
    });

    describe("Order actions", () => {
      beforeEach(async () => {
        // User1 deposits ETHER only
        await exchange.depositEther({ from: user1, value: ether(1) });
        // Gives token to user2
        await token.transfer(user2, tokens(100), { from: deployerAccount });
        // user2 deposit tokens only
        await token.approve(exchange.address, tokens(2), { from: user2 });
        await exchange.depositToken(token.address, tokens(2), { from: user2 });
        // User1 makes an order to buy tokens with ETHER
        await exchange.makeOrder(
          token.address,
          tokens(1),
          ETHER_ADDRESS,
          ether(1),
          { from: user1 }
        );
      });

      describe("Filling orders", () => {
        let result;

        describe("Success", () => {
          beforeEach(async () => {
            // user2 fills the order
            result = await exchange.fillOrder("1", { from: user2 });
          });

          it("Executes the trade & charges fees", async () => {
            let balance;
            balance = await exchange.balanceOf(token.address, user1);
            String(balance).should.equal(
              String(tokens(1)),
              "user1 received tokens"
            );

            balance = await exchange.balanceOf(ETHER_ADDRESS, user2);
            String(balance).should.equal(
              String(ether(1)),
              "user2 received Ether"
            );

            balance = await exchange.balanceOf(ETHER_ADDRESS, user1);
            String(balance).should.equal("0", "user1 Ether deducted");

            balance = await exchange.balanceOf(token.address, user2);
            String(balance).should.equal(
              String(tokens(0.99)),
              "user2 tokens deducted with fee applied"
            );

            const feeAccount = await exchange.feeAccount();
            balance = await exchange.balanceOf(token.address, feeAccount);
            String(balance).should.equal(
              String(tokens(0.01)),
              "feeAccount received fee"
            );
          });

          it("Updates filled orders", async () => {
            const orderFilled = await exchange.orderFilled(1);
            orderFilled.should.equal(true);
          });

          it("Emits an Trade event", () => {
            const log = result.logs[0];
            log.event.should.eq("Trade");
            const event = log.args;
            String(event.id).should.equal("1", "id is correct");
            event.user.should.equal(user1, "user is correct");
            event.tokenGet.should.equal(token.address, "tokenGet is correct");
            String(event.amountGet).should.equal(
              String(tokens(1)),
              "amountGet is correct"
            );
            event.tokenGive.should.equal(ETHER_ADDRESS, "tokenGive is correct");
            String(event.amountGive).should.equal(
              String(ether(1)),
              "amountGive is correct"
            );

            String(event.userFill).should.equal(
              String(user2),
              "userFill is correct"
            );
            String(event.timestamp).length.should.be.at.least(
              1,
              "timestamp is present"
            );
          });
        });

        describe("Failure", () => {
          it("Rejects invalid order ids", async () => {
            const invalidOrderId = 9999;
            await exchange
              .fillOrder(invalidOrderId, { from: user2 })
              .should.be.rejectedWith(EVM_REVERT);
          });

          it("Rejects already filled orders", async () => {
            await exchange.fillOrder("1", { from: user2 }).should.be.fulfilled;
            // Try to fill the same orders
            await exchange
              .fillOrder("1", { from: user2 })
              .should.be.rejectedWith(EVM_REVERT);
          });

          it("Rejects cancelled orders", async () => {
            await exchange.cancelOrder("1", { from: user1 }).should.be
              .fulfilled;
            // Try to fill the order cancelled
            await exchange
              .fillOrder("1", { from: user2 })
              .should.be.rejectedWith(EVM_REVERT);
          });
        });
      });

      describe("Cancelling orders", () => {
        let result;

        describe("Success", async () => {
          beforeEach(async () => {
            result = await exchange.cancelOrder("1", { from: user1 });
          });

          it("updates cancelled orders", async () => {
            const orderCancelled = await exchange.orderCancelled(1);
            orderCancelled.should.equal(true);
          });

          it("Emits Cancel event", () => {
            const log = result.logs[0];
            log.event.should.eq("Cancel");
            const event = log.args;
            String(event.id).should.equal("1", "Order id is correct");
            event.user.should.equal(user1, "user is correct");
            event.tokenGet.should.equal(token.address, "tokenGet is correct");
            String(event.amountGet).should.equal(
              String(tokens(1)),
              "amountGet is correct"
            );
            event.tokenGive.should.equal(ETHER_ADDRESS, "tokenGive is correct");
            String(event.amountGive).should.equal(
              String(ether(1)),
              "amountGive is correct"
            );
            String(event.timestamp).length.should.be.at.least(
              1,
              "timestamp is present"
            );
          });
        });

        describe("Failure", () => {
          it("Rejects invalid order ids", async () => {
            const invalidOrderId = 999;
            await exchange
              .cancelOrder(invalidOrderId, { from: user1 })
              .should.be.rejectedWith(EVM_REVERT);
          });

          it("Rejects unauthorized cancelations", async () => {
            await exchange
              .cancelOrder("1", { from: user2 })
              .should.be.rejectedWith(EVM_REVERT);
          });
        });
      });
    });
  });
});
