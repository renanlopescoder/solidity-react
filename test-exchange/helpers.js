export const ether = (n) => {
  // 18 decilmals like ether so we can use ether standard functions
  return new web3.utils.BN(web3.utils.toWei(String(n), "ether"));
};

// Same as ether 18 decimal places
export const tokens = (n) => ether(n);

export const EVM_REVERT = "VM Exception while processing transaction: revert";

export const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000";
