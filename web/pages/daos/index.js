import Layout from "../../components/layout/app";
import List from "../../components/daos/explore/list";
import useDAOIndex from "../../hooks/daoData";

export default () => {
  const daoIndex = useDAOIndex();
  const daoIndexAsList = (() => {
    const daos = [];
    for (const [key, value] of Object.entries(daoIndex)) {
      if (key == "default") continue;
      daos.push(value);
    }
    return daos;
  })();

  return (
    <Layout title="Communities on Federation">
      <List items={daoIndexAsList} />
      <span style={{ display: "block", textAlign: "center", marginTop: "1.16rem" }}>
        Questions? DM{" "}
        <a href="https://twitter.com/0xWiz_" target="_blank" style={{ color: "#000" }}>
          wiz ⌐◨-◨
        </a>
      </span>
    </Layout>
  );
};
