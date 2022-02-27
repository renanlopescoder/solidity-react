import { tokens, EVM_REVERT } from "./helpers";
const Token = artifacts.require("./Token");

require("chai").use(require("chai-as-promised")).should();

contract("Token", ([deployerAccount, receiver, exchange]) => {
  let token;
  const name = "Temerian oren";
  const symbol = "OREN";
  const decimals = "18";
  const totalSupply = String(tokens(1000000));

  beforeEach(async () => {
    token = await Token.new();
  });

  describe("deployment", () => {
    it("contract name", async () => {
      const result = await token.name();
      result.should.equal(name);
    });

    it("contract symbol", async () => {
      const result = await token.symbol();
      result.should.equal(symbol);
    });

    it("contract decimals", async () => {
      const result = await token.decimals();
      String(result).should.equal(decimals);
    });

    it("contract total supply", async () => {
      const result = await token.totalSupply();
      String(result).should.equal(String(totalSupply));
    });

    it("assings the total supply to the deployer", async () => {
      const result = await token.balanceOf(deployerAccount);
      String(result).should.equal(String(totalSupply));
    });
  });

  describe("sending tokens", () => {
    let amount;
    let result;

    describe("success", () => {
      beforeEach(async () => {
        amount = tokens(100);
        result = await token.transfer(receiver, amount, {
          from: deployerAccount,
        });
      });

      it("transfers token balance", async () => {
        let balanceOf;

        balanceOf = await token.balanceOf(deployerAccount);
        String(balanceOf).should.equal(String(tokens(999900)));

        balanceOf = await token.balanceOf(receiver);
        String(balanceOf).should.equal(String(tokens(100)));
      });

      it("emits a Transfer event", async () => {
        const log = result.logs[0];
        log.event.should.eq("Transfer");
        const event = log.args;
        String(event.from).should.equal(deployerAccount, "From is correct");
        String(event.to).should.equal(receiver, "To is correct");
        String(event.value).should.equal(String(amount), "Value is correct");
      });
    });

    describe("failure", () => {
      it("rejects insufficient balances", async () => {
        let invalidAmount;

        invalidAmount = tokens(100000000); // 100 million tokens - greater than total supply
        await token
          .transfer(receiver, invalidAmount, {
            from: deployerAccount,
          })
          .should.be.rejectedWith(EVM_REVERT);

        // Attempt transfer tokens, when you have none
        invalidAmount = tokens(10); // recipient has no tokens
        await token
          .transfer(deployerAccount, invalidAmount, {
            from: receiver,
          })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("rejects invalid recipient", async () => {
        await token.transfer(0x0, amount, {
          from: deployerAccount,
        }).should.be.rejected;
      });
    });
  });

  describe("approving tokens", () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = tokens(100);
      result = await token.approve(exchange, amount, { from: deployerAccount });
    });

    describe("success", () => {
      it("allocated an allowance for delegated token spending on exchange", async () => {
        const allowance = await token.allowance(deployerAccount, exchange);
        String(allowance).should.equal(String(amount));
      });

      it("emits an Approval event", async () => {
        const log = result.logs[0];
        log.event.should.eq("Approval");
        const event = log.args;
        String(event.owner).should.equal(deployerAccount, "Owner is correct");
        String(event.spender).should.equal(exchange, "Spender is correct");
        String(event.value).should.equal(String(amount), "Value is correct");
      });
    });

    describe("failure", () => {
      it("rejects invalid spenders", async () => {
        await token.approve(0x0, amount, {
          from: deployerAccount,
        }).should.be.rejected;
      });
    });
  });

  describe("delegated token transfers", () => {
    let amount;
    let result;

    beforeEach(async () => {
      amount = tokens(100);
      await token.approve(exchange, amount, { from: deployerAccount });
    });

    describe("success", () => {
      beforeEach(async () => {
        result = await token.transferFrom(deployerAccount, receiver, amount, {
          from: exchange,
        });
      });

      it("transfers token balance", async () => {
        let balanceOf;

        balanceOf = await token.balanceOf(deployerAccount);
        String(balanceOf).should.equal(String(tokens(999900)));

        balanceOf = await token.balanceOf(receiver);
        String(balanceOf).should.equal(String(tokens(100)));
      });

      it("resets the allowance for delegated token spending on exchange", async () => {
        const allowance = await token.allowance(deployerAccount, exchange);
        String(allowance).should.equal("0");
      });

      it("emits a Transfer event", async () => {
        const log = result.logs[0];
        log.event.should.eq("Transfer");
        const event = log.args;
        String(event.from).should.equal(deployerAccount, "From is correct");
        String(event.to).should.equal(receiver, "To is correct");
        String(event.value).should.equal(String(amount), "Value is correct");
      });
    });

    describe("failure", () => {
      it("rejects insufficient allowance amount from total supply", async () => {
        let invalidAmount;

        invalidAmount = tokens(100000000); // 100 million tokens - greater than total supply
        await token
          .transferFrom(deployerAccount, receiver, invalidAmount, {
            from: exchange,
          })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("rejects invalid recipients", async () => {
        await token.transferFrom(deployerAccount, 0x0, amount, {
          from: exchange,
        }).should.be.rejected;
      });

      it("rejects invalid allowance", async () => {
        await token.approve(exchange, tokens(20), { from: deployerAccount });
        await token.transferFrom(deployerAccount, receiver, tokens(100), {
          from: exchange,
        }).should.be.rejected;
      });
    });
  });
});
