const Token = artifacts.require("Token");
const Exchange = artifacts.require("Exchange");

const ether = (n) => {
  // 18 decilmals like ether so we can use ether standard functions
  return new web3.utils.BN(web3.utils.toWei(String(n), "ether"));
};

const wait = (seconds) => {
  const milliseconds = seconds * 1000;
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

// Same as ether 18 decimal places
const tokens = (n) => ether(n);

const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000";

module.exports = async function (callback) {
  try {
    console.log("---> Script running 'seed exchange'");

    ///////////////////////////////////////////////
    /// Loading the token and exchange contract ///
    ///////////////////////////////////////////////

    const token = await Token.deployed();
    console.log("---> Token contract loaded ", token.address);

    const exchange = await Exchange.deployed();
    console.log("---> Exchange contract loaded ", exchange.address);

    //////////////////////////////////////
    /// Seed Token transfer from users ///
    //////////////////////////////////////

    const accounts = await web3.eth.getAccounts();

    const sender = accounts[0];
    const receiver = accounts[1];
    let amount = web3.utils.toWei("10000", "ether"); // 10,000 Tokens

    await token.transfer(receiver, amount, { from: sender });
    console.log(
      `---> Sending token transfer ${amount} Tokens from ${sender} to ${receiver}`,
    );

    ////////////////////////////////////////////////////
    /// Seed Deposit Ether and Approve/Deposit Token ///
    ////////////////////////////////////////////////////

    const user1 = accounts[0];
    const user2 = accounts[1];

    amount = 1;
    await exchange.depositEther({ from: user1, value: ether(amount) });
    console.log(`---> Deposited ${amount} Ether from ${user1}`);

    amount = 10000;
    await token.approve(exchange.address, tokens(amount), { from: user2 });
    console.log(`---> Approved ${amount} tokens from ${user2}`);

    await exchange.depositToken(token.address, tokens(amount), { from: user2 });
    console.log(`---> Deposited ${amount} tokens from ${user2}`);

    ////////////////////////////
    /// Seed Cancelled Order ///
    ////////////////////////////

    let result;
    let orderId;
    result = await exchange.makeOrder(
      token.address,
      tokens(100),
      ETHER_ADDRESS,
      ether(0.1),
      { from: user1 },
    );
    console.log(`---> User makes an new order ${user1}`);

    orderId = result.logs[0].args.id;
    await exchange.cancelOrder(orderId, { from: user1 });
    console.log(`---> Cancelled order from ${user1}`);

    //////////////////////////
    /// Seed Filled Orders ///
    //////////////////////////

    result = await exchange.makeOrder(
      token.address,
      tokens(100),
      ETHER_ADDRESS,
      ether(0.1),
      { from: user1 },
    );
    console.log(`---> Order1: Made order from ${user1}`);

    orderId = result.logs[0].args.id;
    await exchange.fillOrder(orderId, { from: user2 });
    console.log(`---> Order1: Filled order from ${user1}`);

    // Wait 1 second to continue the seed
    await wait(1);

    result = await exchange.makeOrder(
      token.address,
      tokens(50),
      ETHER_ADDRESS,
      ether(0.01),
      { from: user1 },
    );
    console.log(`---> Order2: Made order from ${user1}`);

    orderId = result.logs[0].args.id;
    await exchange.fillOrder(orderId, { from: user2 });
    console.log(`---> Order2: Filled order from ${user1}`);

    // Wait 1 second to continue the seed
    await wait(1);

    result = await exchange.makeOrder(
      token.address,
      tokens(200),
      ETHER_ADDRESS,
      ether(0.15),
      { from: user1 },
    );
    console.log(`---> Order3: Made order from ${user1}`);

    orderId = result.logs[0].args.id;
    await exchange.fillOrder(orderId, { from: user2 });
    console.log(`---> Order3: Filled order from ${user1}`);

    await wait(1);

    ////////////////////////
    /// Seed Open Orders ///
    ////////////////////////

    // User 1 makes 10 orders
    for (let i = 1; i <= 10; i++) {
      result = await exchange.makeOrder(
        token.address,
        tokens(10 * 1),
        ETHER_ADDRESS,
        ether(0.01),
        { from: user1 },
      );
      console.log(`---> Open Order ${i} from ${user1}`);
      // Wait 1 sec for the next iteraction
      await wait(1);
    }

    // User 2 makes 101 orders
    for (let i = 1; i <= 10; i++) {
      result = await exchange.makeOrder(
        ETHER_ADDRESS,
        ether(0.01),
        token.address,
        tokens(10 * i),
        { from: user2 },
      );
      console.log(`---> Open Order ${i} from ${user2}`);
      // Wait 1 sec for the next iteraction
      await wait(1);
    }
  } catch (e) {
    console.log(e);
  } finally {
    callback();
  }
};
