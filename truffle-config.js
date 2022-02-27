require("babel-register");
require("babel-polyfill");

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Local host
      port: 7545,
      network_id: "*", // Match any network id
    },
    rinkeby: {
      host: "127.0.0.1", // Geth
      port: 57366, // Geth
      network_id: 4, // Rinkeby Network ID
      gas: 10000000, // Gas limit
      from: "0x79a4f2Fc986d9aB1E5b66f911bF5F8753c7152a6",
    },
  },
  contracts_directory: "./src/contracts/",
  contracts_build_directory: "./src/abis/",
  compilers: {
    solc: {
      version: "0.5.1",
      settings: {
        evmVersion: "byzantium",
      },
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
