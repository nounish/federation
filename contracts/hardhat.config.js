require("@nomicfoundation/hardhat-toolbox");
require("./tasks");

const dotenv = require("dotenv");
dotenv.config({ path: __dirname + "/.env" });

module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      viaIR: true,
      optimizer: {
        runs: 200,
        enabled: true,
      },
    },
  },
  paths: { sources: "./src" },
  networks: {
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.WALLET_PRIVATE_KEY || null].filter((f) => f),
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: !process.env.CI,
    currency: "USD",
    gasPrice: 15,
    src: "src",
    coinmarketcap: "7643dfc7-a58f-46af-8314-2db32bdd18ba",
  },
};
