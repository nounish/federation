const hre = require("hardhat");
const { ethers } = require("hardhat");
const { setupLargeNetwork, encodeParameters, setupMultiTypeNetwork } = require("../test/utils");
const randomTitle = require("random-title");

// deploy an envinronment for testing locally
async function main() {
  const n = 3;
  const { daos } = await setupLargeNetwork("", n);
  const [owner, s1, s3, proposer] = await ethers.getSigners();

  const multiTypeNetwork = await setupMultiTypeNetwork(owner);
  daos.n4 = { nounish: multiTypeNetwork.n1, members: [owner] };
  daos.n5 = { nounish: multiTypeNetwork.n2, members: [owner] };

  // deploy multicall contract for local testing
  const Multicall = await ethers.getContractFactory("Multicall");
  const multicall = await Multicall.deploy();

  // network daos
  const network = { n1: [], n2: [], n3: [], n4: [], n5: [] };
  await Promise.all(
    Object.keys(daos).map(async (key) => {
      switch (key) {
        case "n1":
          for (let i = 0; i < 5; i++) {
            await daos[key].nounish.token.connect(s1).mint();
            await daos[key].nounish.token.connect(s3).mint();
          }

          await daos[key].nounish.token.connect(s3).delegate(daos.n4.nounish.federation.address);
          await daos[key].nounish.token.connect(s1).delegate(daos.n4.nounish.federation.address);
          network.n4.push("n1");

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
        case "n4": // start building multitype network (builder daos)
          for (let i = 0; i < 5; i++) {
            await daos[key].nounish.token.connect(s1)["mint()"]();
            await daos[key].nounish.token.connect(s3)["mint()"]();
          }

          await daos[key].nounish.token.connect(s1).delegate(daos.n5.nounish.federation.address);
          network.n5.push("n4");
        case "n5":
          for (let i = 0; i < 5; i++) {
            await daos[key].nounish.token.connect(s1)["mint()"]();
          }

          await daos[key].nounish.token.connect(s1).delegate(daos.n4.nounish.federation.address);
          network.n4.push("n5");
        default:
          break;
      }
    })
  );

  // for each dao open up a proposal from a random member
  await Promise.all(
    Object.keys(daos).map(async (key) => {
      if (daos[key].nounish.isBuilder) {
        const targets = [daos[key].nounish.token.address];
        const values = ["0"];
        let ABI = ["function balanceOf(address account)"];
        let iface = new ethers.utils.Interface(ABI);
        const callDatas = [iface.encodeFunctionData("balanceOf", [owner.address])];

        await daos[key].nounish.delegate.propose(targets, values, callDatas, "check owner balance");
      } else {
        for (let i = 0; i < 5; i++) {
          await daos[key].nounish.token.connect(proposer).mint();
        }

        const targets = [daos[key].nounish.token.address];
        const values = ["0"];
        const signatures = ["balanceOf(address)"];
        const callDatas = [encodeParameters(["address"], [owner.address])];

        await daos[key].nounish.delegate
          .connect(proposer)
          .propose(targets, values, signatures, callDatas, `# ${randomTitle({ min: 4, max: 11 })}`);
      }
    })
  );

  await hre.network.provider.send("evm_setAutomine", [false]);
  await hre.network.provider.send("evm_setIntervalMining", [0]);
  await hre.network.provider.send("hardhat_mine", ["0x5DC"]); // 1500 blocks
  await hre.network.provider.send("evm_setAutomine", [true]);

  const federation = await Promise.all(
    Object.keys(daos).map(async (key) => {
      let t;
      const isBuilder = daos[key].nounish.isBuilder;
      if (isBuilder) {
        t = await daos[key].nounish.delegate.treasury();
      } else {
        t = await daos[key].nounish.delegate.timelock();
      }

      return {
        name: key,
        dao: daos[key].nounish.delegate.address,
        treasury: t,
        federation: daos[key].nounish.federation.address,
        token: daos[key].nounish.token.address,
        members: daos[key].members.map((m) => m.address),
        network: network[key],
        isBuilder: isBuilder,
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
