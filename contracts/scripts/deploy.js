const hre = require("hardhat");

async function main() {
  const Delegate = await hre.ethers.getContractFactory("Delegate");
  const delegate = await Delegate.deploy();

  await delegate.deployed();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
