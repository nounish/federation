import { useEffect, useState } from "react";
import Data from "../../data/daos/index.json";
import List from "../../components/daos/proposals/list";
import Layout from "../../components/layout/app";
import { useRouter } from "next/router";
import useStore from "../../hooks/store/chain/useStore";
import { useProvider } from "wagmi";
import ParentDAOContext from "../../hooks/context/parentDAO";

export default () => {
  const router = useRouter();
  const provider = useProvider();
  const { name } = router.query;

  const getProposals = useStore((state) => state.getProposals);
  const proposals = useStore((state) => {
    return state[name]?.proposals;
  });

  const fedMeta = useStore((state) => state[name]?.fedMeta);

  useEffect(() => {
    if (name) {
      getProposals(name, provider);
    }
  }, [name]);

  const d = Data[name];
  if (!name) return null;

  return (
    <ParentDAOContext.Provider value={d}>
      <Layout title={`Federation - ${d.name}`} hasBreadCrumbs>
        <List props={proposals} dao={d} fedMeta={fedMeta} />
      </Layout>
    </ParentDAOContext.Provider>
  );
};
