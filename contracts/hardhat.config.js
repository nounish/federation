require("@nomicfoundation/hardhat-toolbox");
const { ethers } = require("ethers");

task("mine", "mines an arbitrary amount of blocks locally")
  .addParam("n", "number of blocks")
  .setAction(async (args) => {
    const n = parseInt(args.n, 10);
    const nAsHex = ethers.utils.hexlify(n);

    await network.provider.send("evm_setAutomine", [false]);
    await network.provider.send("evm_setIntervalMining", [0]);
    await network.provider.send("hardhat_mine", [nAsHex]);
    await network.provider.send("evm_setAutomine", [true]);
  });

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
};
