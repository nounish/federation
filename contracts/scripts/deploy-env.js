const hre = require("hardhat");
const { ethers } = require("hardhat");
const { setup, encodeParameters } = require("../test/utils");

async function main() {
  const { n1, n2 } = await setup();
  const [owner, eDAOMember] = await ethers.getSigners();

  // deploy multicall contract for local testing
  const Multicall = await ethers.getContractFactory("Multicall");
  const multicall = await Multicall.deploy();

  // delegate n2 representation to federation
  await n2.token.delegate(n1.federation.address);

  // create external proposal under another edao user
  await n2.token.connect(eDAOMember).mint();

  const targets = [n2.token.address];
  const values = ["0"];
  const signatures = ["balanceOf(address)"];
  const callDatas = [encodeParameters(["address"], [owner.address])];

  await n2.delegate
    .connect(eDAOMember)
    .propose(targets, values, signatures, callDatas, "# This is the title of a proposal");

  const walletInfo = [
    { name: "owner", address: owner.address },
    { name: "eDAOMember", address: eDAOMember.address },
  ];

  const n1Treasury = await n1.delegate.timelock();
  const n2Treasury = await n2.delegate.timelock();

  const info = [
    {
      name: "NounsDAO",
      dao: n1.delegate.address,
      treasury: n1Treasury,
      federation: n1.federation.address,
      token: n1.token.address,
    },
    {
      name: "Lil NounsDAO",
      dao: n2.delegate.address,
      treasury: n2Treasury,
      federation: n2.federation.address,
      token: n2.token.address,
    },
  ];

  console.log("");
  console.log("Wallets:", walletInfo);
  console.log("");
  console.log("Multicall:", multicall.address);
  console.log("");
  console.log("Federation:", info);
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
