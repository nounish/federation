require("@nomicfoundation/hardhat-toolbox");
require("./tasks");

const dotenv = require("dotenv");
dotenv.config({ path: __dirname + "/.env" });

module.exports = {
  solidity: {
    version: "0.8.16",
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
};
