task("mine", "mines an arbitrary amount of blocks locally")
  .addParam("n", "number of blocks")
  .setAction(async (args, { ethers }) => {
    const n = parseInt(args.n, 10);
    const nAsHex = ethers.utils.hexlify(n);

    await network.provider.send("evm_setAutomine", [false]);
    await network.provider.send("evm_setIntervalMining", [0]);
    await network.provider.send("hardhat_mine", [nAsHex]);
    await network.provider.send("evm_setAutomine", [true]);
  });
