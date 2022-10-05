import { RightArrow } from "../icons";
import Link from "next/link";
import styles from "./hero.module.scss";

export default () => {
  return (
    <div className={styles.w}>
      <h2 className="n">DAO-to-DAO governance rails</h2>
      <p className={styles.subtitle}>
        Federation is an on-chain delegated voter which enables communities in the Nouns ecosystem to participate in
        governance with one another.
      </p>
      <Link href="/daos">
        <a className={styles.action}>
          Launch App <RightArrow width="20px" />
        </a>
      </Link>
    </div>
  );
};
