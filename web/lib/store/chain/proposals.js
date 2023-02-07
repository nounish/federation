import { ethers } from "ethers";
import { Contract as MulticallContract, Provider as MulticallProvider, setMulticallAddress } from "ethers-multicall";
import NounishDAOABI from "../../../abi/nounish-dao.json";
import BuilderDAOABI from "../../../abi/builder-dao.json";
import FedDelegateABI from "../../../abi/f-delegate.json";
import FedMultiTypeDelegateABI from "../../../abi/f-mt-delegate.json";
import { slice } from "lodash";

// custom multicall address for local testing
setMulticallAddress(31337, "0x38A70c040CA5F5439ad52d0e821063b0EC0B52b6");

export const getDAOProposalCreatedLogs = async (address, isBuilderDAO = false, provider, queryFromBlock = 0) => {
  if (!isBuilderDAO) {
    return nounsProposalCreatedLogs(address, provider, queryFromBlock);
  }

  return builderProposalCreatedLogs(address, provider, queryFromBlock);
};

const builderProposalCreatedLogs = async (address, provider, queryFromBlock = 0) => {
  const nd = new ethers.Contract(address, BuilderDAOABI, provider);

  const qf = {
    ...nd.filters.ProposalCreated(null, null, null, null, null, null, null),
    fromBlock: queryFromBlock,
  };

  const logs = await nd.queryFilter(qf);
  const props = logs
    .map((l) => {
      const p = l.args;

      return {
        id: p.proposalId,
        description: p.description,
        voteStart: p.proposal.voteStart,
        voteEnd: p.proposal.voteEnd,
      };
    })
    .filter((f) => f);

  return { dao: address, proposals: props };
};

const nounsProposalCreatedLogs = async (address, provider, queryFromBlock = 0) => {
  const nd = new ethers.Contract(address, NounishDAOABI, provider);

  const qf = {
    ...nd.filters.ProposalCreated(null, null, null, null, null, null, null, null, null),
    fromBlock: queryFromBlock,
  };

  const logs = await nd.queryFilter(qf);
  const props = logs
    .map((l) => {
      const p = l.args;

      return {
        id: p.id,
        description: p.description,
        startBlock: p.startBlock,
        endBlock: p.endBlock,
      };
    })
    .filter((f) => f);

  return { dao: address, proposals: props };
};

export const getDAOProposals = async (ids = [], isBuilderDAO = false, address, provider) => {
  if (!isBuilderDAO) {
    return getNounsDAOProposals(ids, address, provider);
  }

  return getBuilderDAOProposals(ids, address, provider);
};

const getBuilderDAOProposals = async (ids = [], address, provider) => {
  const { chainId } = await provider.getNetwork();
  const mcProvider = new MulticallProvider(provider, chainId);
  const nd = new MulticallContract(address, BuilderDAOABI);

  let props = await mcProvider.all(
    ids.map((id) => {
      return nd.getProposal(id);
    })
  );

  props = props.map((p, i) => {
    return {
      id: ids[i],
      builderDAO: true,
      proposer: p.proposer,
      quorumVotes: p.quorumVotes,
      voteStart: p.voteStart,
      voteEnd: p.voteEnd,
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

const getNounsDAOProposals = async (ids = [], address, provider) => {
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
export const getFedProposalCreatedLogs = async (
  address,
  provider,
  eDAOAddress,
  multiType = false,
  queryFromBlock = 0
) => {
  if (multiType) {
    return getMultiTypeLogs(address, provider, eDAOAddress, queryFromBlock);
  }

  return getMultiTokenLogs(address, provider, eDAOAddress, queryFromBlock);
};

const getMultiTypeLogs = async (address, provider, eDAOAddress, queryFromBlock = 0) => {
  const nd = new ethers.Contract(address, FedMultiTypeDelegateABI, provider);

  const qf = {
    ...nd.filters.MultiTypeProposalCreated(null, null, eDAOAddress, null, null, null, null, null, null),
    fromBlock: queryFromBlock,
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
      startTimestamp: p.startTimestamp,
      endTimestamp: p.endTimestamp,
      quorumVotes: p.quorumVotes,
    };
  });

  return ps;
};

const getMultiTokenLogs = async (address, provider, eDAOAddress, queryFromBlock = 0) => {
  const nd = new ethers.Contract(address, FedDelegateABI, provider);

  const qf = {
    ...nd.filters.ProposalCreated(null, null, eDAOAddress, null, null, null, null),
    fromBlock: queryFromBlock,
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

  return ps;
};

export const getFedMeta = async (address, provider) => {
  const nd = new ethers.Contract(address, FedDelegateABI, provider);
  const block = await provider.getBlock("latest");
  const blockNumber = ethers.BigNumber.from(block.number);
  const execWindow = await nd.execWindow();

  return { currentBlock: blockNumber.toNumber(), execWindow: execWindow.toNumber() };
};

export const getFedMultiTypeMeta = async (address, provider) => {
  const nd = new ethers.Contract(address, FedMultiTypeDelegateABI, provider);
  const block = await provider.getBlock("latest");
  const blockNumber = ethers.BigNumber.from(block.number);
  const execWindowSecs = await nd.execWindowSecs();
  const execWindowBlocks = await nd.execWindowBlocks();

  return {
    currentBlock: blockNumber.toNumber(),
    execWindowSecs: execWindowSecs.toNumber(),
    execWindowBlocks: execWindowBlocks.toNumber(),
  };
};

export const getFedProposals = async (ids = [], multiType = false, address, provider) => {
  const { chainId } = await provider.getNetwork();
  const mcProvider = new MulticallProvider(provider, chainId);
  const nd = new MulticallContract(address, multiType ? FedMultiTypeDelegateABI : FedDelegateABI);

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
      endTimestamp: p.endTimestamp,
      startTimestamp: p.startTimestamp,
      forVotes: p.forVotes,
      againstVotes: p.againstVotes,
      abstainVotes: p.abstainVotes,
      vetoed: p.vetoed,
      executed: p.executed,
    };
  });

  return props.filter((f) => f);
};

export const getFedProposal = async (id, multiType = false, address, provider) => {
  const nd = new ethers.Contract(address, multiType ? FedMultiTypeDelegateABI : FedDelegateABI, provider);
  const p = await nd.proposals(id);

  return {
    id: p.id,
    proposer: p.proposer,
    quorumVotes: p.quorumVotes,
    eta: p.eta,
    startBlock: p.startBlock,
    endBlock: p.endBlock,
    endTimestamp: p.endTimestamp,
    startTimestamp: p.startTimestamp,
    forVotes: p.forVotes,
    againstVotes: p.againstVotes,
    abstainVotes: p.abstainVotes,
    vetoed: p.vetoed,
    executed: p.executed,
  };
};
