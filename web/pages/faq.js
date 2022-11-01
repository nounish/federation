import Layout from "../components/layout/content";
import { Accordion } from "react-bootstrap";
import styles from "../components/faq/faq.module.scss";
import FAQ from "../components/faq";

const items = [
  {
    title: "What is Federation?",
    body: `
    Federation is a smart contract and web app that enables DAOs in the Nouns ecosystem to vote on each other's proposals.
    `,
  },
  {
    title: "How does it work?",
    body: `Today, cross-DAO voting is usually done off-chain through Snapshot or Discord polls and then executed by a centralized party through a multi-sig.
    <br/><br/>
    Federation removes this centralization risk by operating as an on-chain delegated voter. A Federation contract can be deployed and external voting rights can
    be delegated to it.
    <br/><br/>
    Members of a community can then vote on the outcome they would like to see for an external proposal using
    Federation's voting interface. The Federation contract will then cast its vote on the proposal
    based on the outcome that the majority of the DAO members voted for.
    `,
  },
  {
    title: "What are some use cases?",
    body: `The most common use case is for DAOs in the Nouns ecosystem (Lil Nouns, Gnars, etc.)
    who hold Nouns NFTs to vote on Nouns DAO governance. 
    <br/><br/>
    Cross-DAO voting allows DAOs in the ecosystem to have a stake in each other’s success while
    aligning incentives and resources for mutual benefit.
    <br/><br/>
    As the ecosystem grows, you can imagine a world where subDAOs vote on each other’s proposals (e.g. Lil Nouns voting on SharkDAO
    proposals), or even the development of ecosystem-wide political parties.
    `,
  },
  {
    title: "How can my community sign up?",
    body: `We are currently onboarding DAOs in the Nouns ecosystem. If you are part of one and are
    interested in using Federation to enable on-chain governance between your DAO and others,
    reach out to <a href="https://twitter.com/0xWiz_" target="_blank">wiz</a> on Twitter.`,
  },
  {
    title: "Is Federation open-source?",
    body: `Federation public infrastructure and free to use. The codebase is entirely open-source and available on <a target="_blank" href="https://github.com/nounish/federation">GitHub</a>.`,
  },
  {
    title: "Wait... but what are Nouns?",
    body: `Nouns is a Decentralized Autonomous Organization where one NFT (representing one vote
    over the allocation of the treasury) is auctioned off each day. 
    <br/><br/>
    Nouns DAO exists to proliferate
    the Nouns meme, and many “forks” of the organization have popped up given its success in
    developing economically sustainable communities. You can learn more at <a target="_blank" href="https://nouns.wtf">nouns.wtf</a>`,
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
