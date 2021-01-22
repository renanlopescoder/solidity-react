const { assert } = require("chai");
const Token = artifacts.require("Token");
const EthSwap = artifacts.require("EthSwap");

require("chai").use(require("chai-as-promised")).should();

function tokens(n) {
  return web3.utils.toWei(n, "ether");
}

contract("EthSwap", ([deployer, investor]) => {
  let token, ethSwap;

  before(async () => {
    token = await Token.new();
    ethSwap = await EthSwap.new(token.address);
    await token.transfer(ethSwap.address, tokens("1000000"));
  });

  describe("Token deployment", async () => {
    it("contract has a name", async () => {
      const name = await token.name();
      assert.equal(name, "Developer Token");
    });
  });

  describe("EthSwap deployment", async () => {
    it("contract has a name", async () => {
      const name = await ethSwap.name();
      assert.equal(name, "EthSwap Instant Exchange");
    });

    it("contract has tokens", async () => {
      const balance = await token.balanceOf(ethSwap.address);
      assert.equal(String(balance), tokens("1000000"));
    });
  });

  describe("buyTokens()", async () => {
    let result;
    before(async () => {
      // Purchase token before each test
      result = await ethSwap.buyTokens({
        from: investor,
        value: web3.utils.toWei("1", "ether"),
      });
    });

    it("Allows users to instantly purchase tokens from ethSwap for a fixed price", async () => {
      // Check investor token balace after purchase
      const investorBalance = await token.balanceOf(investor);
      assert.equal(String(investorBalance), tokens("100"));

      // Check ethSwap balance after purchase
      let ethSwapBalance = await token.balanceOf(ethSwap.address);
      assert.equal(String(ethSwapBalance), tokens("999900"));
      ethSwapBalance = await web3.eth.getBalance(ethSwap.address);
      assert.equal(String(ethSwapBalance), web3.utils.toWei("1", "Ether"));

      const event = result.logs[0].args;
      assert.equal(event.account, investor);
      assert.equal(event.token, token.address);
      assert.equal(String(event.amount), String(tokens("100")));
      assert.equal(String(event.rate), "100");
    });
  });

  describe("sellTokens()", async () => {
    let result;
    before(async () => {
      // Investor must approve the tokens before the purchase
      await token.approve(ethSwap.address, tokens("100"), { from: investor });
      result = await ethSwap.sellTokens(tokens("100"), { from: investor });
    });

    it("Allows users to instantly sell tokens to ethSwap for a fixed price", async () => {
      const investorBalance = await token.balanceOf(investor);
      assert.equal(String(investorBalance), tokens("0"));

      // Check ethSwap balance after purchase
      let ethSwapBalance = await token.balanceOf(ethSwap.address);
      assert.equal(String(ethSwapBalance), tokens("1000000"));
      ethSwapBalance = await web3.eth.getBalance(ethSwap.address);
      assert.equal(String(ethSwapBalance), web3.utils.toWei("0", "Ether"));

      // Check logs event correct data
      const event = result.logs[0].args;
      assert.equal(event.account, investor);
      assert.equal(event.token, token.address);
      assert.equal(String(event.amount), String(tokens("100")));
      assert.equal(String(event.rate), "100");

      // FAILUE: investor can't sell more tokens than they have
      await ethSwap.sellTokens(tokens("500"), { from: investor }).should.be
        .rejected;
    });
  });
});
