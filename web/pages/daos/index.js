import Layout from "../../components/layout/app";
import List from "../../components/daos/explore/list";
import Data from "../../data/daos/list";

export default () => {
  return (
    <Layout title="Communities on Federation">
      <List items={Data} />
    </Layout>
  );
};
