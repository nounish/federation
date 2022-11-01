import Layout from "../components/layout/content";
import { Accordion } from "react-bootstrap";
import styles from "../components/faq/faq.module.scss";
import FAQ from "../components/faq";

const items = [
  {
    title: "What is Federation?",
    body: `
    Federation is an on-chain governance tool that enables DAOs in the Nouns ecosystem to vote on each other's proposals.
    <br/><br/>
    For example, Lil Nouns DAO purchased Nouns NFTs with their treasury, giving them voting power in NounsDAO. With Federation, members of Lil Nouns DAO can collectively decide how to vote on NounsDAO proposals directly without any human intermediaries.`,
  },
  {
    title: "How does it work?",
    body: `Federation operates as an on-chain delegated voter. To get started, voting power is delegated to the Federation contract by your DAO.<br/><br/> Members of the DAO can then vote on the outcome they would like to see for a proposal. Federation will then cast its vote on the proposal based on the outcome that the majority of the DAO members voted for.`,
  },
  {
    title: "How can my community start using Federation?",
    body: `We are currently onboarding DAOs in the Nouns ecosystem. If you are part of one and are interested in using Federation to enable on-chain governance between your DAO and others, reach out to <a target="_blank" href="https://twitter.com/0xWiz_">wiz</a> on Twitter.`,
  },
  {
    title: "Is Federation open-source?",
    body: `Federation is public infrastructure and free to use. The codebase is entirely open-source and available on <a target="_blank" href="https://github.com/nounish/federation">GitHub</a>.`,
  },
  {
    title: "What are Nouns?",
    body: `NounsDAO is an onchain governance experiment where NFTs represent membership to the DAO. To learn more about NounsDAO visit their website at <a target="_blank" href="https://nouns.wtf">nouns.wtf</a>`,
  },
];

const headerStyle = {
  margin: "1.16rem 0 1.66rem 0",
  color: "#000",
  fontWeight: "bold",
};

export default () => {
  return (
    <Layout title="Frequently asked questions">
      <div className={styles.lw}>
        <h1 style={headerStyle}>Frequently asked questions</h1>
        <Accordion className={styles.accordion} defaultActiveKey="0" flush>
          {items.map((item, i) => (
            <FAQ key={i} item={item} i={i} />
          ))}
        </Accordion>
      </div>
    </Layout>
  );
};
