import { persist } from "zustand/middleware";
import create from "zustand";
import { ethers } from "ethers";
import Proposal from "../../../lib/federation/proposal";
import TestDAOIndex from "../../../data/test/daos";
import MainnetDAOIndex from "../../../data/test/daos";
import {
  getDAOProposals,
  getDAOProposalCreatedLogs,
  getFedProposals,
  getFedProposalCreatedLogs,
  getFedProposal,
  getFedMeta,
} from "../../../lib/store/chain/proposals";

const isDev = process.env.NEXT_PUBLIC_ENV == "dev";
const DAOIndex = isDev ? TestDAOIndex : MainnetDAOIndex;

// compose data store methods on dao index as some kind of ETH poor mans db
let store = (set, get) => {
  return Object.assign({}, DAOIndex, {
    // getProposals pulls props from each external DAO and filter out any proposals with an endblock
    // in the past. mucho expensivo, be careful...
    getProposals: async (key, provider) => {
      // the parent dao
      const d = get()[key];

      // get addresses for each external dao in the network
      const networkAddrs = d.network.map((n) => {
        const nd = DAOIndex[n.key];
        return { dao: nd.addresses.dao, key: n.key };
      });

      const fedMeta = await getFedMeta(d.addresses.federation, provider);

      // get all external proposals and group them by dao
      const propsByDAO = await Promise.all(
        networkAddrs.map(async (n) => {
          const ePropCreatedLogs = await getDAOProposalCreatedLogs(n.dao, provider, DAOIndex[n.key].mainnetBirthBlock);

          // get external prop data and merge it with log data
          const eIDs = ePropCreatedLogs.proposals.map((p) => p.id);
          const eProps = await getDAOProposals(eIDs, ePropCreatedLogs.dao, provider);

          const eMergedProps = ePropCreatedLogs.proposals.map((p) => {
            const found = eProps.proposals.find((f) => f.id.eq(p.id));
            return { ...p, ...found };
          });

          // get all prop data in the federation for each external dao and merge it with log data
          const fedPropCreatedLogs = await getFedProposalCreatedLogs(
            d.addresses.federation,
            provider,
            n.dao,
            eIDs,
            d.fedBirthBlock
          );

          const fIDs = fedPropCreatedLogs.map((p) => p.id);
          const ps = await getFedProposals(fIDs, d.addresses.federation, provider);

          const fedMergedProps = fedPropCreatedLogs.map((p) => {
            const found = ps.find((f) => f.id.eq(p.id));
            return { ...p, ...found };
          });

          // key props by ePropID and propID (for fed) so we can easily merge them into one
          // general type used throughout the app
          const eKeyByPropID = eMergedProps.reduce((acc, prop) => {
            const { id } = prop;
            return { ...acc, [id.toNumber()]: prop };
          }, {});

          const fKeyByEPropID = fedMergedProps.reduce((acc, prop) => {
            const { ePropID } = prop;
            return { ...acc, [ePropID.toNumber()]: prop };
          }, {});

          const normalizedProps = Object.keys(eKeyByPropID).map((k) => {
            const eProp = eKeyByPropID[k];
            const fProp = fKeyByEPropID[k];
            return new Proposal(n, eProp, fProp);
          });

          return { key: n.key, proposals: normalizedProps };
        })
      );

      // reduces all props into one feed sorted by active status
      // and by how soon they will expire
      const propFeed = propsByDAO
        .reduce((acc, p) => {
          return acc.concat(p.proposals);
        }, [])
        .sort((a, b) => {
          if (a.proposed && !b.proposed) {
            return -1;
          }

          if (b.proposed && !a.proposed) {
            return 1;
          }

          if (a.externalEndBlock > b.externalEndBlock) {
            return 1;
          }

          return -1;
        })
        .filter(filterInactive);

      const nState = { [key]: { ...get()[key], proposals: propFeed, fedMeta } };
      set((state) => {
        return {
          ...state,
          ...nState,
        };
      });
    },
    // getTreasuryMeta gets any information about the treasury
    getTreasuryMeta: async (key, provider) => {
      const addresses = get()[key].addresses;
      const balance = await provider.getBalance(addresses.treasury);
      const ethBalance = ethers.utils.formatEther(balance);

      // merge old state with new state
      const nState = { [key]: { ...get()[key], treasury: { balance: ethBalance } } };
      set((state) => {
        return {
          ...state,
          ...nState,
        };
      });
    },
    refreshProposal: async (key, pID, eDAOKey, eID, provider) => {
      const proposals = get()[key].proposals || [];
      const fedAddress = get()[key].addresses.federation;

      const refreshedProps = await Promise.all(
        proposals.map(async (p) => {
          if (p.eDAOKey === eDAOKey && p.eID === eID) {
            const updated = await getFedProposal(pID, fedAddress, provider);
            return p.update(updated);
          }

          return p;
        })
      );

      const nState = { [key]: { ...get()[key], proposals: refreshedProps } };
      set((state) => {
        return {
          ...state,
          ...nState,
        };
      });
    },
    setProposalProposed: (key, pID, eDAOKey, eID) => {
      let proposals = get()[key].proposals || [];
      let isProposed = false;
      proposals = proposals.map((p) => {
        if (p.eDAOKey === eDAOKey && p.eID === eID) {
          if (p.proposed) {
            isProposed = true;
          }

          p.id = pID;
          p.proposed = true;
        }

        return p;
      });

      if (isProposed) return;

      const nState = { [key]: { ...get()[key], proposals } };
      set((state) => {
        return {
          ...state,
          ...nState,
        };
      });
    },
  });
};

const filterInactive = (f) => {
  if (f.canceled || f.vetoed) {
    return null;
  }

  return f;
};

store = persist(store, { name: "federation" });

export default create(store);
