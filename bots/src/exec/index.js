const { ethers } = require("ethers");
const { DefenderRelaySigner, DefenderRelayProvider } = require("defender-relay-client/lib/ethers");
const DelegateABI = require("../../abi/multitokenDelegate.json");

// **NOTE** set to your federation delegate address
const DELEGATE_ADDRESS = "0xf23815d7ddc73d5cf34671f373d427414dc39dc9";

exports.handler = async function (event) {
  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider, { speed: "fast" });
  const fedContract = new ethers.Contract(DELEGATE_ADDRESS, DelegateABI, signer);

  try {
    const execWindow = await fedContract.execWindow();
    const executableProps = await getExecutableFedProposals(provider, execWindow);

    for (let i = 0; i < executableProps.length; i++) {
      const prop = await fedContract.proposals(executableProps[i].id);
      if (!prop.executed) {
        console.log("executing prop", prop.id.toNumber());
        await fedContract.execute(executableProps[i].id);
      }
    }
  } catch (ex) {
    console.log(`error: ${ex}`);
  }
};

// get executable proposals in federation
const getExecutableFedProposals = async (provider, execWindow) => {
  const nd = new ethers.Contract(DELEGATE_ADDRESS, DelegateABI, provider);
  const block = await provider.getBlock("latest");
  const blockNumber = ethers.BigNumber.from(block.number);

  const qf = {
    ...nd.filters.ProposalCreated(null, null, null, null, null, null, null),
    fromBlock: 15670000,
  };

  const logs = await nd.queryFilter(qf);
  const ps = logs.map((l) => {
    const p = l.args;
    return {
      id: p.id,
      proposer: p.proposer,
      eDAO: p.eDAO,
      ePropID: p.ePropID,
      startBlock: p.startBlock,
      endBlock: p.endBlock,
      quorumVotes: p.quorumVotes,
    };
  });

  return ps.filter((f) => {
    return blockNumber.gte(f.endBlock - execWindow) && blockNumber.lte(f.endBlock);
  });
};

// to run locally uncomment the following code
// ===========================================
// if (require.main === module) {
//   const { API_KEY: apiKey, API_SECRET: apiSecret } = process.env;
//   exports
//     .handler({ apiKey, apiSecret })
//     .then(() => process.exit(0))
//     .catch((error) => {
//       console.error(error);
//       process.exit(1);
//     });
// }
