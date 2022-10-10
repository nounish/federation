import { useEffect } from "react";
import { useProvider } from "wagmi";
import List from "../../components/daos/proposals/list";
import Layout from "../../components/layout/app";
import { useRouter } from "next/router";
import useStore from "../../hooks/store/chain/useStore";
import useDAOIndex from "../../hooks/daoData";
import ParentDAOContext from "../../hooks/context/parentDAO";

export default () => {
  const daoIndex = useDAOIndex();
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

  const d = daoIndex[name];
  if (!name) return null;

  return (
    <ParentDAOContext.Provider value={d}>
      <Layout title={d.displayName} hasBreadCrumbs>
        <List props={proposals} dao={d} fedMeta={fedMeta} />
      </Layout>
    </ParentDAOContext.Provider>
  );
};
