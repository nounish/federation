const hre = require("hardhat");
const { ethers } = require("hardhat");
const { setupLargeNetwork, encodeParameters, randomInt } = require("../test/utils");
const randomTitle = require("random-title");

async function main() {
  const n = 3;
  const { daos } = await setupLargeNetwork("", n);
  const [owner] = await ethers.getSigners();

  // deploy multicall contract for local testing
  const Multicall = await ethers.getContractFactory("Multicall");
  const multicall = await Multicall.deploy();

  // network daos
  const network = { n1: [], n2: [], n3: [] };
  await Promise.all(
    Object.keys(daos).map(async (key) => {
      switch (key) {
        case "n1":
          await daos[key].nounish.token.delegate(daos.n2.nounish.federation.address);
          network.n2.push("n1");

          if (daos[key].members.length) {
            await daos[key].nounish.token.connect(daos[key].members[0]).delegate(daos.n3.nounish.federation.address);
            daos[key].members.shift();
            network.n3.push("n1");
          }

          break;
        case "n2":
          await daos[key].nounish.token.delegate(daos.n1.nounish.federation.address);
          network.n1.push("n2");

          if (daos[key].members.length) {
            await daos[key].nounish.token.connect(daos[key].members[0]).delegate(daos.n3.nounish.federation.address);
            daos[key].members.shift();
            network.n3.push("n2");
          }

          break;
        case "n3":
          await daos[key].nounish.token.delegate(daos.n1.nounish.federation.address);
          network.n1.push("n3");

          break;
      }
    })
  );

  // for each dao open up a proposal from a random member
  await Promise.all(
    Object.keys(daos).map(async (key) => {
      const { members } = daos[key];
      const randomMember = members[Math.floor(Math.random() * members.length)];
      const targets = [daos[key].nounish.token.address];
      const values = ["0"];
      const signatures = ["balanceOf(address)"];
      const callDatas = [encodeParameters(["address"], [owner.address])];

      if (randomMember) {
        await daos[key].nounish.delegate
          .connect(randomMember)
          .propose(targets, values, signatures, callDatas, `# ${randomTitle({ min: 4, max: 11 })}`);

        await hre.network.provider.send("evm_setAutomine", [false]);
        await hre.network.provider.send("evm_setIntervalMining", [0]);
        await hre.network.provider.send("hardhat_mine", ["0x5DC"]); // 1500 blocks
        await hre.network.provider.send("evm_setAutomine", [true]);
      }
    })
  );

  const federation = await Promise.all(
    Object.keys(daos).map(async (key) => {
      const t = await daos[key].nounish.delegate.timelock();
      return {
        name: key,
        dao: daos[key].nounish.delegate.address,
        treasury: t,
        federation: daos[key].nounish.federation.address,
        token: daos[key].nounish.token.address,
        members: daos[key].members.map((m) => m.address),
        network: network[key],
      };
    })
  );

  console.log("Multicall:", multicall.address);
  console.log("");
  console.log("Federation:", federation);
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
