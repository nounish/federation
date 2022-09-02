const { network } = require("hardhat");

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

// deployNounish creates a new Nouns instance (NFT + governance)
const deployNounish = async function (owner) {
  // nft
  const Token = await ethers.getContractFactory("NounishToken");
  const token = await Token.deploy();

  // mint some tokens to owner
  await token.mint();
  await token.mint();
  await token.mint();
  await token.mint();
  await token.mint();

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

// makeProposal creates a proposal against an external DAO and opens a federation proposal
// to vote against it
const makeProposal = async function (n1, n2) {
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
  const ePropID = await n2.delegate.latestProposalIds(eDAOMember.address);
  await n1.federation.propose(n2.delegate.address, ePropID);
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

module.exports = {
  encodeParameters,
  address,
  rpc,
  mineBlock,
  advanceBlocks,
  setNextBlockTimestamp,
  setup,
  deployNounish,
  makeProposal,
};
