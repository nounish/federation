const hre = require("hardhat");
const { ethers } = require("hardhat");
const { setupLargeNetwork, encodeParameters, setupMultiTypeNetwork } = require("../test/utils");
const randomTitle = require("random-title");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

// deploy an envinronment for testing locally
async function main() {
  const n = 3;
  const { daos } = await setupLargeNetwork("", n);
  const [owner, s1, s3, proposer, proposer2, proposer3, proposer4, proposer5, proposer6, proposer7, bidder1, bidder2, bidder3, bidDelegator, bidDelegator2, bidDelegator3, bidDelegator4, bidDelegator5] = await ethers.getSigners();

  const multiTypeNetwork = await setupMultiTypeNetwork(owner);
  daos.n4 = { nounish: multiTypeNetwork.n1, members: [owner] };
  daos.n5 = { nounish: multiTypeNetwork.n2, members: [owner] };

  // deploy multicall contract for local testing
  const Multicall = await ethers.getContractFactory("Multicall");
  const multicall = await Multicall.deploy();

  // deploy vote bidding contract
  const DelegateBid = await ethers.getContractFactory("DelegateBid");
  const db = await DelegateBid.deploy(
    150, // 30 min exec window
    ethers.BigNumber.from("10000000000000000"), // 0.01 eth base tip
    ethers.BigNumber.from("100000000000000000"), // 0.1 eth min bid
    5 // bid inc %,
  );
  // deploy another vote bidding contract
  const db2 = await DelegateBid.deploy(
    150, // 30 min exec window
    ethers.BigNumber.from("10000000000000000"), // 0.01 eth base tip
    ethers.BigNumber.from("100000000000000000"), // 0.1 eth min bid
    5 // bid inc %,
  );
  const db3 = await DelegateBid.deploy(
    150, // 30 min exec window
    ethers.BigNumber.from("10000000000000000"), // 0.01 eth base tip
    ethers.BigNumber.from("100000000000000000"), // 0.1 eth min bid
    5 // bid inc %,
  );
  const db4 = await DelegateBid.deploy(
    150, // 30 min exec window
    ethers.BigNumber.from("10000000000000000"), // 0.01 eth base tip
    ethers.BigNumber.from("100000000000000000"), // 0.1 eth min bid
    5 // bid inc %,
  );
  const db5 = await DelegateBid.deploy(
    150, // 30 min exec window
    ethers.BigNumber.from("10000000000000000"), // 0.01 eth base tip
    ethers.BigNumber.from("100000000000000000"), // 0.1 eth min bid
    5 // bid inc %,
  );

  // network daos
  const network = { n1: [], n2: [], n3: [], n4: [], n5: [] };
  const mineTwoWeeks = await helpers.mine(1000800);
  await Promise.all(
    Object.keys(daos).map(async (key) => {
      switch (key) {
        case "n1":
          for (let i = 0; i < 5; i++) {
            await daos[key].nounish.token.connect(s1).mint();
            await daos[key].nounish.token.connect(s3).mint();
            await daos[key].nounish.token.connect(bidDelegator).mint();
            await daos[key].nounish.token.connect(bidDelegator2).mint();
            await daos[key].nounish.token.connect(bidDelegator2).mint();
            await daos[key].nounish.token.connect(bidDelegator2).mint();
            await daos[key].nounish.token.connect(bidDelegator3).mint();
            await daos[key].nounish.token.connect(bidDelegator3).mint();
            await daos[key].nounish.token.connect(bidDelegator4).mint();
            await daos[key].nounish.token.connect(bidDelegator4).mint();
            await daos[key].nounish.token.connect(bidDelegator4).mint();
            await daos[key].nounish.token.connect(bidDelegator4).mint();
            await daos[key].nounish.token.connect(bidDelegator5).mint();
          }

          await daos[key].nounish.token.connect(s3).delegate(daos.n4.nounish.federation.address);
          await daos[key].nounish.token.connect(s1).delegate(daos.n4.nounish.federation.address);
          await daos[key].nounish.token.connect(bidDelegator).delegate(db.address);
          await daos[key].nounish.token.connect(bidDelegator2).delegate(db2.address);
          await daos[key].nounish.token.connect(bidDelegator3).delegate(db3.address);
          await daos[key].nounish.token.connect(bidDelegator4).delegate(db4.address);
          await daos[key].nounish.token.connect(bidDelegator5).delegate(db5.address);

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

  // create proposals
  const createProposals = async (proposalCount, dao, network) => {
    const proposers = [proposer, proposer2, proposer3, proposer4, proposer5, proposer6];
    for (let i = 0; i < proposalCount; i++) {
      
      const targets = [dao.nounish.token.address];
      const values = ["0"];
      const signatures = ["balanceOf(address)"];
      const callDatas = [encodeParameters(["address"], [owner.address])];

      await dao.nounish.delegate
        .connect(network.length ? daos[network[0]].members[0] : proposers[i])
        .propose(targets, values, signatures, callDatas, `# ${randomTitle({ min: 4, max: 11 })}`);
    }
  };

  const bidOnProp = async (key, bidder = bidder1, bidAmount = "0.25", propId = 1, support = 2, reason = "test bid") => {
    const overrides = {
      value: ethers.utils.parseEther(bidAmount)
    };
    await db.connect(bidder).createBid(daos[key].nounish.delegate.address, propId, support, reason, overrides);
  }
  

  // for each dao open up a proposal from a random member
  await Promise.all(
    Object.keys(daos).map(async (key) => {
      if (daos[key].nounish.isBuilder) {
        // builder daos
        const targets = [daos[key].nounish.token.address];
        const values = ["0"];
        let ABI = ["function balanceOf(address account)"];
        let iface = new ethers.utils.Interface(ABI);
        const callDatas = [iface.encodeFunctionData("balanceOf", [owner.address])];

        await daos[key].nounish.delegate.propose(targets, values, callDatas, "check owner balance");
      } else {
        
        for (let i = 0; i < 5; i++) {
          await daos[key].nounish.token.connect(proposer).mint();
          await daos[key].nounish.token.connect(proposer2).mint();
          await daos[key].nounish.token.connect(proposer3).mint();
          await daos[key].nounish.token.connect(proposer4).mint();
          await daos[key].nounish.token.connect(proposer5).mint();
          await daos[key].nounish.token.connect(proposer6).mint();
          await daos[key].nounish.token.connect(proposer7).mint();
        }

        const targets = [daos[key].nounish.token.address];
        const values = ["0"];
        const signatures = ["balanceOf(address)"];
        const callDatas = [encodeParameters(["address"], [owner.address])];
        const votingDelay = await daos[key].nounish.delegate.votingDelay();

        // #1 
        await daos[key].nounish.delegate
          .connect(proposer)
          .propose(targets, values, signatures, callDatas, `# ${randomTitle({ min: 4, max: 11 })}`);        
        await bidOnProp(key, bidder1, "0.42", 1, 2, "test bid");

        // #2
        await daos[key].nounish.delegate
          .connect(proposer2)
          .propose(targets, values, signatures, callDatas, `# ${randomTitle({ min: 4, max: 11 })}`);        
        
        // #3 
        await daos[key].nounish.delegate
          .connect(proposer3)
          .propose(targets, values, signatures, callDatas, `# ${randomTitle({ min: 4, max: 11 })}`);     
        await bidOnProp(key, bidder2, "0.2", 3, 1, "test bid");   
        await bidOnProp(key, bidder2, "1.4", 3, 0, "second bid");   
        await daos[key].nounish.delegate
          .connect(proposer3).cancel(3);

        // #4
        await daos[key].nounish.delegate
          .connect(proposer4)
          .propose(targets, values, signatures, callDatas, `# ${randomTitle({ min: 4, max: 11 })}`);
          // voting delay + 100
          await helpers.mine(votingDelay.toNumber() + 100);
          await daos[key].nounish.delegate
          .connect(proposer4)
          .castVote(4,1);
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
  console.log("DelegateBid:", db.address);
  console.log("DelegateBid2:", db2.address);
  console.log("DelegateBid3:", db3.address);
  console.log("DelegateBid4:", db4.address);
  console.log("DelegateBid5:", db5.address);
  console.log("Delegated from address:", bidDelegator.address);
  console.log("DelegateBid factory: ", DelegateBid.address)
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
