import { ethers } from "ethers";
import { Contract as MulticallContract, Provider as MulticallProvider, setMulticallAddress } from "ethers-multicall";
import NounishDAOABI from "../../../abi/nounish-dao.json";
import FedDelegateABI from "../../../abi/f-delegate.json";

// custom multicall address for local testing
setMulticallAddress(31337, "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d");

export const getDAOProposalCreatedLogs = async (address, provider, queryFromBlock = 0) => {
  const nd = new ethers.Contract(address, NounishDAOABI, provider);
  const block = await provider.getBlock("latest");
  const blockNumber = ethers.BigNumber.from(block.number);

  const qf = {
    ...nd.filters.ProposalCreated(null, null, null, null, null, null, null, null, null),
    fromBlock: queryFromBlock,
  };

  const logs = await nd.queryFilter(qf);
  const props = logs
    .map((l) => {
      const p = l.args;

      // skip expired proposals
      if (p.endBlock.gt(blockNumber)) {
        return {
          id: p.id,
          description: p.description,
          startBlock: p.startBlock,
          endBlock: p.endBlock,
        };
      }

      return null;
    })
    .filter((f) => f);

  return { dao: address, proposals: props };
};

export const getDAOProposals = async (ids = [], address, provider) => {
  const { chainId } = await provider.getNetwork();
  const mcProvider = new MulticallProvider(provider, chainId);
  const nd = new MulticallContract(address, NounishDAOABI);

  let props = await mcProvider.all(
    ids.map((id) => {
      return nd.proposals(id);
    })
  );

  props = props.map((p) => {
    return {
      id: p.id,
      proposer: p.proposer,
      quorumVotes: p.quorumVotes,
      eta: p.eta,
      startBlock: p.startBlock,
      endBlock: p.endBlock,
      forVotes: p.forVotes,
      againstVotes: p.againstVotes,
      abstainVotes: p.abstainVotes,
      canceled: p.canceled,
      vetoed: p.vetoed,
      executed: p.executed,
    };
  });

  return { dao: address, proposals: props.filter((f) => f) };
};

// get active proposals in federation by dao and prop id
export const getFedProposalCreatedLogs = async (address, provider, eDAOAddress, eProps = []) => {
  const nd = new ethers.Contract(address, FedDelegateABI, provider);
  const block = await provider.getBlock("latest");
  const blockNumber = ethers.BigNumber.from(block.number);

  let props = [];
  for (let i = 0; i < eProps.length; i++) {
    const prop = eProps[i];

    const qf = {
      ...nd.filters.ProposalCreated(null, null, eDAOAddress, prop, null, null, null),
    };

    const logs = await nd.queryFilter(qf);
    const ps = logs
      .map((l) => {
        const p = l.args;

        // skip expired proposals
        if (p.endBlock.gt(blockNumber)) {
          return {
            id: p.id,
            proposer: p.proposer,
            eDAO: p.eDAO,
            ePropID: p.ePropID,
            startBlock: p.startBlock,
            endBlock: p.endBlock,
            quorumVotes: p.quorumVotes,
          };
        }

        return null;
      })
      .filter((f) => f);

    props = props.concat(ps);
  }

  return props;
};

export const getFedMeta = async (address, provider) => {
  const nd = new ethers.Contract(address, FedDelegateABI, provider);
  const block = await provider.getBlock("latest");
  const blockNumber = ethers.BigNumber.from(block.number);
  const execWindow = await nd.execWindow();

  return { currentBlock: blockNumber.toNumber(), execWindow: execWindow.toNumber() };
};

export const getFedProposals = async (ids = [], address, provider) => {
  const { chainId } = await provider.getNetwork();
  const mcProvider = new MulticallProvider(provider, chainId);
  const nd = new MulticallContract(address, FedDelegateABI);

  let props = await mcProvider.all(
    ids.map((id) => {
      return nd.proposals(id);
    })
  );

  props = props.map((p) => {
    return {
      id: p.id,
      proposer: p.proposer,
      quorumVotes: p.quorumVotes,
      eta: p.eta,
      startBlock: p.startBlock,
      endBlock: p.endBlock,
      forVotes: p.forVotes,
      againstVotes: p.againstVotes,
      abstainVotes: p.abstainVotes,
      vetoed: p.vetoed,
      executed: p.executed,
    };
  });

  return props.filter((f) => f);
};

export const getFedProposal = async (id, address, provider) => {
  const nd = new ethers.Contract(address, FedDelegateABI, provider);
  const p = await nd.proposals(id);

  return {
    id: p.id,
    proposer: p.proposer,
    quorumVotes: p.quorumVotes,
    eta: p.eta,
    startBlock: p.startBlock,
    endBlock: p.endBlock,
    forVotes: p.forVotes,
    againstVotes: p.againstVotes,
    abstainVotes: p.abstainVotes,
    vetoed: p.vetoed,
    executed: p.executed,
  };
};
