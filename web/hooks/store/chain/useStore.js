import { persist } from "zustand/middleware";
import create from "zustand";
import _ from "lodash";
import { ethers } from "ethers";
import Proposal from "../../../lib/federation/proposal";
import TestDAOIndex from "../../../data/test/daos";
import MainnetDAOIndex from "../../../data/mainnet/daos";
import {
  getDAOProposals,
  getDAOProposalCreatedLogs,
  getFedProposals,
  getFedProposalCreatedLogs,
  getFedProposal,
  getFedMeta,
  getFedMultiTypeMeta,
} from "../../../lib/store/chain/proposals";

const isDev = process.env.NEXT_PUBLIC_ENV === "dev";
const DAOIndex = isDev ? TestDAOIndex : MainnetDAOIndex;

// compose data store methods on dao index as some kind of ETH poor mans db
let store = (set, get) => {
  return Object.assign({}, DAOIndex, {
    // getProposals pulls props from each external DAO and filter out any proposals with an endblock
    // in the past. mucho expensivo, be careful...
    getProposals: async (key, provider) => {
      ensureNested(key, get, set);

      const block = await provider.getBlock("latest");
      const blockNumber = ethers.BigNumber.from(block.number);
      const blockTimestamp = ethers.BigNumber.from(block.timestamp);

      // the parent dao
      const d = get()[key];

      // get addresses for each external dao in the network
      const networkAddrs = d.network.map((n) => {
        const nd = DAOIndex[n.key];
        return { dao: nd.addresses.dao, builderDAO: nd.builderDAO, key: n.key };
      });

      let fedMeta;
      if (!d.multiType) {
        fedMeta = await getFedMeta(d.addresses.federation, provider);
      } else {
        fedMeta = await getFedMultiTypeMeta(d.addresses.federation, provider);
      }
      fedMeta.blockTimestamp = blockTimestamp.toNumber();

      // get all external proposals and group them by dao
      const propsByDAO = await Promise.all(
        networkAddrs.map(async (n) => {
          const ePropCreatedLogs = await getDAOProposalCreatedLogs(
            n.dao,
            n.builderDAO,
            provider,
            DAOIndex[n.key].mainnetBirthBlock
          );

          // get external prop data and merge it with log data
          const eIDs = ePropCreatedLogs.proposals.map((p) => p.id);
          const eProps = await getDAOProposals(eIDs, n.builderDAO, ePropCreatedLogs.dao, provider);

          const eMergedProps = ePropCreatedLogs.proposals.map((p) => {
            const found = eProps.proposals.find((f) => {
              if (f.builderDAO) {
                return f.id == p.id;
              }

              return f.id.eq(p.id);
            });

            return { ...p, ...found };
          });

          // get all prop data in the federation for each external dao and merge it with log data
          const fedPropCreatedLogs = await getFedProposalCreatedLogs(
            d.addresses.federation,
            provider,
            n.dao,
            d.multiType,
            d.fedBirthBlock
          );

          const fIDs = fedPropCreatedLogs.map((p) => p.id);
          const ps = await getFedProposals(fIDs, d.multiType, d.addresses.federation, provider);

          const fedMergedProps = fedPropCreatedLogs.map((p) => {
            const found = ps.find((f) => f.id.eq(p.id));
            return { ...p, ...found };
          });

          // key props by ePropID and propID (for fed) so we can easily merge them into one
          // general type used throughout the app
          const eKeyByPropID = eMergedProps.reduce((acc, prop) => {
            const { id } = prop;
            if (d.multiType) {
              const key = id.toNumber ? ethers.utils.hexZeroPad(ethers.BigNumber.from(id).toHexString(), 32) : id;
              return { ...acc, [key]: prop };
            }

            return { ...acc, [id.toNumber()]: prop };
          }, {});

          const fKeyByEPropID = fedMergedProps.reduce((acc, prop) => {
            const { ePropID } = prop;
            const key = d.multiType ? ePropID : ePropID.toNumber();
            return { ...acc, [key]: prop };
          }, {});

          const normalizedProps = Object.keys(eKeyByPropID)
            .map((k) => {
              const eProp = eKeyByPropID[k];
              const fProp = fKeyByEPropID[k];

              // TODO :- ensure that fProp has correct proposed...

              // ignore inactive props in external dao but allow active props to
              // be proposed
              if (!eProp.builderDAO) {
                if (!fProp && eProp.endBlock.toNumber() <= blockNumber.toNumber()) {
                  return null;
                }

                // defeated props should not show up in the feed
                if (fProp?.endBlock.lt(blockNumber) && !fProp?.executed) return null;

                return new Proposal(n, blockNumber, eProp, fProp);
              }

              if (!fProp && eProp.voteEnd <= blockTimestamp.toNumber()) {
                return null;
              }

              // defeated props should not show up in the feed
              if (fProp?.voteEnd < blockTimestamp && !fProp?.executed) return null;

              return new Proposal(n, blockNumber, eProp, fProp);
            })
            .filter((f) => f);

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

          if (a.externalEndTimestamp > b.externalEndTimestamp) {
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
      ensureNested(key, get, set);

      const addresses = get()[key].addresses;
      const balance = await provider.getBalance(addresses.treasury);
      const ethBalance = ethers.utils.formatEther(balance);
      const fixed = (+ethBalance).toFixed(0);

      // merge old state with new state
      const nState = { [key]: { ...get()[key], treasury: { balance: fixed } } };
      set((state) => {
        return {
          ...state,
          ...nState,
        };
      });
    },
    refreshProposal: async (key, pID, eDAOKey, eID, provider) => {
      ensureNested(key, get, set);

      const proposals = get()[key].proposals || [];
      const fedAddress = get()[key].addresses.federation;
      const multiType = get()[key].multiType;

      const refreshedProps = await Promise.all(
        proposals.map(async (p) => {
          if (p.eDAOKey === eDAOKey && p.eID === eID) {
            const updated = await getFedProposal(pID, multiType, fedAddress, provider);
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

// ensureNested ensures that the nested objects are always up to date
// since persist will only do shallow updates whenever the underlying store
// json is updated. this should be called whenever a method pulls from
// deeply nested objects in the store.
const ensureNested = async (key, get, set) => {
  const d = get()[key];

  // compare nested types
  let merge = false;
  if (!_.isEqual(d.addresses, DAOIndex[key].addresses)) {
    merge = true;
  }

  if (!_.isEqual(d.network, DAOIndex[key].network)) {
    merge = true;
  }

  if (!_.isEqual(d.multiToken, DAOIndex[key].multiToken)) {
    merge = true;
  }

  if (merge) {
    console.log("merging state");
    const nState = { [key]: _.merge(d, DAOIndex[key]) };
    await set(() => {
      return {
        ...nState,
      };
    });
  }
};

store = persist(store, { name: isDev ? "federation-dev" : "federation" });

export default create(store);
