const ether = (n) => {
  // 18 decilmals like ether so we can use ether standard functions
  return new web3.utils.BN(web3.utils.toWei(String(n), "ether"));
};

// Same as ether 18 decimal places
const tokens = (n) => ether(n);

const EVM_REVERT = "VM Exception while processing transaction: revert";

const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000";

module.exports = { ether, tokens, EVM_REVERT, ETHER_ADDRESS };
