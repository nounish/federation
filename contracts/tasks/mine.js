const helpers = require("@nomicfoundation/hardhat-network-helpers");

task("mine", "mines an arbitrary amount of blocks locally")
  .addParam("n", "number of blocks")
  .setAction(async (args, { ethers }) => {
    const n = parseInt(args.n, 10);
    const nAsHex = ethers.utils.hexlify(n);
    await helpers.mine(nAsHex, { interval: 12 });
  });
