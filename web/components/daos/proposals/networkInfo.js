import Link from "next/link";
import styles from "./networkInfo.module.scss";
import useDAOIndex from "../../../hooks/daoData";
import DAO from "./dao";
import { TooltipProvider } from "@radix-ui/react-tooltip";

export default ({ dao }) => {
  const daoIndex = useDAOIndex();

  const network = dao.network.map((d) => {
    return daoIndex[d.key];
  });

  return (
    <div className={styles.w}>
      <b>{dao.name}</b> NFT holders can vote on the following proposals. Votes can be cast against an external proposal
      once quorum is reached.{" "}
      <a target="_blank" href="/faq">
        Learn more
      </a>
      .<br />
      <h4>Delegated Tokens</h4>
      <TooltipProvider>
        <ul className={styles.network}>
          {network.map((d, id) => {
            return <DAO key={id} dao={d} parentFedAddress={dao.addresses.federation} />;
          })}
        </ul>
      </TooltipProvider>
    </div>
  );
};
