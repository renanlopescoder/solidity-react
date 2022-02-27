import Web3 from "web3";
import EthSwap from "../abis/EthSwap.json";
import Token from "../abis/Token.json";

export const loadWeb3 = async () => {
  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    await window.ethereum.enable();
  } else if (window.web3) {
    window.web3 = new Web3(window.web3.currentProvider);
  } else {
    window.alert(
      "Non-Ethereum brower detected. You should consider trying MetaMask!",
    );
  }
};

const loadContract = async (data) => {
  // MetaMask Network ID
  const networkId = await web3.eth.net.getId();

  const contractData = data.networks[networkId];
  let contract;
  if (contractData) {
    contract = new web3.eth.Contract(data.abi, contractData.address);
  } else {
    window.alert("Contract not deployed to detected network");
  }

  return contract;
};

export const getBlockchainData = async () => {
  if (!window.web3.eth) {
    await loadWeb3();
  }

  const web3 = window.web3;
  const [account] = await web3.eth.getAccounts();

  const ethBalance = await web3.eth.getBalance(account);
  const ethBalanceData = {
    wei: ethBalance,
    balance: web3.utils.fromWei(ethBalance, "Ether"),
  };

  const token = await loadContract(Token);
  const tokenBalance = await token.methods.balanceOf(account).call();

  const tokenBalanceData = {
    wei: tokenBalance,
    balance: web3.utils.fromWei(tokenBalance, "Ether"),
  };

  return {
    account,
    ethBalanceData,
    tokenBalanceData,
  };
};

export const buyTokens = async (account, etherAmount) => {
  const ethSwapContract = await loadContract(EthSwap);
  const etherWei = window.web3.utils.toWei(etherAmount);

  const hash = await ethSwapContract.methods
    .buyTokens()
    .send({ from: account, value: etherWei });
  location.reload();

  return hash;
};

export const sellTokens = async (account, tokenAmount) => {
  const ethSwapContract = await loadContract(EthSwap);
  const tokenWei = window.web3.utils.toWei(tokenAmount);

  const tokenContract = await loadContract(Token);
  console.log(ethSwapContract._address);
  await tokenContract.methods
    .approve(ethSwapContract._address, tokenWei)
    .send({ from: account });

  const hash = await ethSwapContract.methods
    .sellTokens(tokenWei)
    .send({ from: account });

  location.reload();

  return hash;
};
