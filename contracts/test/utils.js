const { BigNumber } = require("ethers");

// setup deploys two networked Nouns instances (NFT + governance) as well as their Federation delegates
// to be used for each test run. allows setting a custom vetoer for test purposes
const setup = async function (vetoer = "") {
  const [owner] = await ethers.getSigners();

  const nounish = await deployNounish(owner);
  const nounishTwo = await deployNounish(owner);

  // deploy a federation delegate for each nounish instance
  const Delegate = await ethers.getContractFactory("Delegate");
  const fDelegate = await Delegate.deploy(
    vetoer || owner.address,
    nounish.token.address,
    nounish.delegate.address,
    2500
  );
  const fDelegateTwo = await Delegate.deploy(
    vetoer || owner.address,
    nounishTwo.token.address,
    nounishTwo.delegate.address,
    2500
  );

  nounish.federation = fDelegate;
  nounishTwo.federation = fDelegateTwo;

  return { n1: nounish, n2: nounishTwo };
};

// setupV2 deploys two networked Nouns instances (NFT + governanceV2) as well as their Federation delegates
// to be used for each test run. allows setting a custom vetoer for test purposes
const setupV2 = async function (vetoer = "") {
  const [owner] = await ethers.getSigners();

  const nounish = await deployNounishV2(owner);
  const nounishTwo = await deployNounishV2(owner);

  // deploy a federation delegate for each nounish instance
  const Delegate = await ethers.getContractFactory("Delegate");
  const fDelegate = await Delegate.deploy(
    vetoer || owner.address,
    nounish.token.address,
    nounish.delegate.address,
    2500
  );
  const fDelegateTwo = await Delegate.deploy(
    vetoer || owner.address,
    nounishTwo.token.address,
    nounishTwo.delegate.address,
    2500
  );

  nounish.federation = fDelegate;
  nounishTwo.federation = fDelegateTwo;

  return { n1: nounish, n2: nounishTwo };
};

// setupBid deploys two networked Nouns instances (NFT + governance) as well as their Federation bid delegates
const setupBid = async function () {
  const [owner] = await ethers.getSigners();

  const nounish = await deployNounish(owner);
  const nounishTwo = await deployNounish(owner);

  // deploy a federation delegate for each nounish instance
  const Delegate = await ethers.getContractFactory("DelegateBid");
  const fDelegate = await Delegate.deploy(
    150, // 30 min exec window
    BigNumber.from("10000000000000000"), // 0.01 eth base tip
    BigNumber.from("100000000000000000"), // 0.1 eth min bid
    5 // bid inc %,
  );

  const fDelegateTwo = await Delegate.deploy(
    150, // 30 min exec window
    BigNumber.from("10000000000000000"), // 0.01 eth base tip
    BigNumber.from("100000000000000000"), // 0.1 eth min bid
    5 // bid inc %,
  );

  nounish.federation = fDelegate;
  nounishTwo.federation = fDelegateTwo;

  return { n1: nounish, n2: nounishTwo };
};

// setupMultiTokenNetwork deploys two networked Nouns instances (NFT + governance) as well as multi-token
// Federation delegates to be used for each test run.
// allows setting a custom vetoer for test purposes
const setupMultiTokenNetwork = async function (vetoer, weights = [1, 1]) {
  const [owner] = await ethers.getSigners();

  const nounish = await deployNounishV2(owner);
  const nounishTwo = await deployNounish(owner);

  // third nounish doesn't require a fed delegate. it's only used to
  // test multi-token governance
  const nounishThree = await deployNounish(owner);

  // deploy a federation delegate for each nounish instance
  const Delegate = await ethers.getContractFactory("DelegateMultiToken");

  const fDelegate = await Delegate.deploy((vetoer || owner).address, 2500, 500);
  const fDelegateTwo = await Delegate.deploy((vetoer || owner).address, 2500, 500);

  await fDelegate
    .connect(vetoer || owner)
    ._setNounishTokens([nounish.token.address, nounishTwo.token.address], weights, [true, false]);

  await fDelegateTwo
    .connect(vetoer || owner)
    ._setNounishTokens([nounish.token.address, nounishTwo.token.address], weights, [true, false]);

  nounish.federation = fDelegate;
  nounishTwo.federation = fDelegateTwo;

  return { n1: nounish, n2: nounishTwo, n3: nounishThree };
};

// setupMultiTypeNetwork deploys two networked Nouns instances of different types (classical and builder dao)
const setupMultiTypeNetwork = async function (vetoer, weights = [1, 1]) {
  const [owner] = await ethers.getSigners();

  const nounish = await deployBuilderDAO(owner);
  const nounishTwo = await deployNounishV2(owner);

  // deploy a federation delegate for each nounish instance
  const Delegate = await ethers.getContractFactory("DelegateMultiType");
  const fDelegate = await Delegate.deploy((vetoer || owner).address, 2500, 30000, 500);
  const fDelegateTwo = await Delegate.deploy((vetoer || owner).address, 2500, 30000, 500);

  // third nounish doesn't require a fed delegate. it's only used to
  // test multi-token governance
  const nounishThree = await deployNounishV2(owner);

  await fDelegate.connect(vetoer || owner)._setNounishTokens([nounish.token.address], [1], [false], [1]);

  await fDelegateTwo
    .connect(vetoer || owner)
    ._setNounishTokens([nounish.token.address, nounishTwo.token.address], weights, [true, false], [1, 0]);

  nounish.federation = fDelegate;
  nounishTwo.federation = fDelegateTwo;

  nounish.isBuilder = true;
  nounishTwo.isBuilder = false;
  nounishThree.isBuilder = false;

  return { n1: nounish, n2: nounishTwo, n3: nounishThree };
};

// setupLargeNetwork deploys many networked Nouns instances (NFT + governance) as well as their Federation delegates
// to be used local testing. allows setting a custom vetoer for test purposes. Last nounish uses DelegateFixedQuorum
const setupLargeNetwork = async function (vetoer = "", n = 3) {
  const [owner, m1, m2, m3, m4, m5] = await ethers.getSigners();
  const daoMembers = [m1, m2, m3, m4, m5];

  let daos = {};
  for (let i = 1; i <= n; i++) {
    const nounish = await deployNounishV2(owner, 50);
    const type = i == n ? "DelegateFixedQuorum" : "Delegate";
    const Delegate = await ethers.getContractFactory(type);

    const args = [vetoer || owner.address, nounish.token.address, nounish.delegate.address, 2500];
    if (type === "DelegateFixedQuorum") {
      args.push(5);
    }

    const fDelegate = await Delegate.deploy(...args);

    nounish.federation = fDelegate;
    daos[`n${i}`] = { nounish };
  }

  // randomly mint a couple of NFTs for each dao member
  for (let i = 1; i <= n; i++) {
    let members = [];
    for (let j = 0; j < daoMembers.length; j++) {
      const m = daoMembers[j];

      const n = randomInt(0, 25);
      for (let p = 0; p < n; p++) {
        await daos[`n${i}`].nounish.token.connect(m).mint();
      }

      if (n > 0) {
        members.push(m);
      }
    }

    daos[`n${i}`].members = members;
  }

  return { daos };
};

// deployNounish creates a new Nouns instance (NFT + governance)
const deployNounish = async function (owner, numToMint = 5) {
  // nft
  const Token = await ethers.getContractFactory("NounishToken");
  const token = await Token.deploy();

  // mint some tokens to owner
  for (let i = 0; i < numToMint; i++) {
    await token.mint();
  }

  // nouns governance
  const GovTimelock = await ethers.getContractFactory("NounsDAOExecutor");
  const GovProxy = await ethers.getContractFactory("NounsDAOProxy");
  const GovLogic = await ethers.getContractFactory("NounsDAOLogicV1");

  const minDelay = 60 * 60 * 24 * 2; // 2 days
  const govLogic = await GovLogic.deploy();

  // gov timelock admin should be the dao proxy address so we must precalculate it here
  const calculatedProxyAddress = ethers.utils.getContractAddress({
    from: owner.address,
    nonce: (await owner.getTransactionCount()) + 1,
  });

  const govTimelock = await GovTimelock.deploy(calculatedProxyAddress, minDelay);

  // 2% quorum
  const opts = [govTimelock.address, token.address, owner.address, address(0), govLogic.address, 17280, 1, 1, 200];
  const govProxy = await GovProxy.deploy(...opts);
  const delegate = await govLogic.attach(govProxy.address);

  return { delegate, token };
};

// deployNounishV2 creates a new Nouns instance (NFT + governanceV2)
const deployNounishV2 = async function (owner, numToMint = 5) {
  // nft
  const Token = await ethers.getContractFactory("NounishToken");
  const token = await Token.deploy();

  // mint some tokens to owner
  for (let i = 0; i < numToMint; i++) {
    await token.mint();
  }

  // nouns governance
  const GovTimelock = await ethers.getContractFactory("NounsDAOExecutor");
  const GovProxy = await ethers.getContractFactory("NounsDAOProxyV2");
  const GovLogic = await ethers.getContractFactory("NounsDAOLogicV2");

  const minDelay = 60 * 60 * 24 * 2; // 2 days
  const govLogic = await GovLogic.deploy();

  // gov timelock admin should be the dao proxy address so we must precalculate it here
  const calculatedProxyAddress = ethers.utils.getContractAddress({
    from: owner.address,
    nonce: (await owner.getTransactionCount()) + 1,
  });

  const govTimelock = await GovTimelock.deploy(calculatedProxyAddress, minDelay);

  const MIN_QUORUM_VOTES_BPS = 200;
  const MAX_QUORUM_VOTES_BPS = 1900;

  // 2% quorum
  const opts = [
    govTimelock.address,
    token.address,
    owner.address,
    address(0),
    govLogic.address,
    17280,
    1,
    1,
    {
      minQuorumVotesBPS: MIN_QUORUM_VOTES_BPS,
      maxQuorumVotesBPS: MAX_QUORUM_VOTES_BPS,
      quorumCoefficient: 0,
    },
  ];
  const govProxy = await GovProxy.deploy(...opts);
  const delegate = await govLogic.attach(govProxy.address);

  return { delegate, token };
};

// deployBuilderDAO creates a new BuilderDAO instance (NFT + governanceV2)
const deployBuilderDAO = async function (owner, numToMint = 5) {
  const [, s0, s1, s2, s3] = await ethers.getSigners();
  const bd = await ethers.getContractFactory("BuilderDeploy");
  const bDeployer = await bd.deploy();

  const csTx = await bDeployer.run(owner.address);
  const tx = await csTx.wait();
  const e = tx.events.find((e) => e.event === "Deployed");

  const { token, metadata, treasury, governor } = e.args;
  const bt = await ethers.getContractFactory("Token");
  const builderToken = await bt.attach(token);

  await builderToken.updateMinters([
    { minter: owner.address, allowed: true },
    { minter: s0.address, allowed: true },
    { minter: s1.address, allowed: true },
    { minter: s2.address, allowed: true },
    { minter: s3.address, allowed: true },
  ]);

  // set metadata
  const md = await ethers.getContractFactory("MetadataRenderer");
  const builderMetadata = await md.attach(metadata);
  await builderMetadata.addProperties(
    ["testing"],
    [
      { propertyId: 0, name: "failure1", isNewProperty: true },
      { propertyId: 0, name: "failure2", isNewProperty: true },
    ],
    { baseUri: "BASE_URI", extension: "EXTENSION" }
  );

  for (let i = 0; i < numToMint; i++) {
    await builderToken.connect(owner)["mint()"]();
  }

  const gf = await ethers.getContractFactory("Governor");
  const builderGovernor = await gf.attach(governor);

  return { delegate: builderGovernor, token: builderToken };
};

// makeProposal creates a proposal against an external DAO and opens a federation proposal
// to vote against it
const makeProposal = async function (n1, n2, skipFedProp = false) {
  const [owner, eDAOMember] = await ethers.getSigners();

  // delegate n2 representation to federation
  await n2.token.delegate(n1.federation.address);

  // create external proposal under another edao user
  await n2.token.connect(eDAOMember).mint();
  await mineBlock();

  const targets = [n2.token.address];
  const values = ["0"];
  const signatures = ["balanceOf(address)"];
  const callDatas = [encodeParameters(["address"], [owner.address])];

  await n2.delegate.connect(eDAOMember).propose(targets, values, signatures, callDatas, "check owner balance");

  // create a federatation prop against external proposal
  if (!skipFedProp) {
    const ePropID = await n2.delegate.latestProposalIds(eDAOMember.address);
    await n1.federation.propose(n2.delegate.address, ePropID);
  }
};

// makeProposalMultiType creates a proposal against an external DAO and opens a federation multitype proposal
// to vote against it. govType should be set for the delegate receiving the proposal (n2).
const makeProposalMultiType = async function (n1, n2, skipFedProp = false, govType = 0) {
  const [owner, eDAOMember] = await ethers.getSigners();

  // delegate n2 representation to federation
  await n2.token.delegate(n1.federation.address);

  // create external proposal under another edao user
  if (govType === 0) {
    await n2.token.connect(eDAOMember).mint();
  } else {
    await n2.token.connect(eDAOMember)["mint()"]();
  }

  await mineBlock();

  const targets = [n2.token.address];
  const values = ["0"];
  const signatures = ["balanceOf(address)"];
  const callDatas = [encodeParameters(["address"], [owner.address])];

  let propID;
  if (govType === 0) {
    await n2.delegate.connect(eDAOMember).propose(targets, values, signatures, callDatas, "check owner balance");
  } else {
    const tx = await n2.delegate.connect(eDAOMember).propose(targets, values, callDatas, "check owner balance");
    const txres = await tx.wait();
    const createdEvent = txres.events.find((e) => e.event === "ProposalCreated");
    propID = createdEvent.args.proposalId;
  }

  // create a federatation prop against external proposal
  if (!skipFedProp) {
    if (govType === 0) {
      const ePropID = await n2.delegate.latestProposalIds(eDAOMember.address);
      const ePropIDBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify(ePropID.toNumber()), 32);
      await n1.federation.propose(n2.delegate.address, ePropIDBytes, govType);
    } else {
      await n1.federation.propose(n2.delegate.address, propID, govType);
    }
  }
};

const encodeParameters = (types, values) => {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
};

const address = (n) => {
  return `0x${n.toString(16).padStart(40, "0")}`;
};

const rpc = ({ method, params }) => {
  return network.provider.send(method, params);
};

const mineBlock = async () => {
  await network.provider.send("evm_mine");
};

const advanceBlocks = async (blocks) => {
  for (let i = 0; i < blocks; i++) {
    await mineBlock();
  }
};

const setNextBlockTimestamp = async (n, mine = true) => {
  await rpc({ method: "evm_setNextBlockTimestamp", params: [n] });
  if (mine) await mineBlock();
};

const randomInt = (min, max) => {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
};

module.exports = {
  encodeParameters,
  address,
  rpc,
  mineBlock,
  advanceBlocks,
  setNextBlockTimestamp,
  deployNounish,
  deployNounishV2,
  deployBuilderDAO,
  makeProposal,
  makeProposalMultiType,
  randomInt,
  setup,
  setupV2,
  setupLargeNetwork,
  setupMultiTokenNetwork,
  setupMultiTypeNetwork,
  setupBid,
};
