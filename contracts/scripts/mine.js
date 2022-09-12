const hre = require("hardhat");

async function main() {
  await hre.network.provider.send("evm_setAutomine", [false]);
  await hre.network.provider.send("evm_setIntervalMining", [0]);
  await hre.network.provider.send("hardhat_mine", ["0x100"]); // 256 blocks
  await hre.network.provider.send("evm_setAutomine", [true]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
