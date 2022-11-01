import Link from "next/link";
import { Noggles } from "../icons";
import styles from "./hero.module.scss";
import Sig from "../sig";

export default () => {
  return (
    <div className={styles.w}>
      <div className={styles.emp}>
        <Link href="/faq">
          <a className={styles.pill}>
            Questions? ⋅ Learn more <span>→</span>
          </a>
        </Link>
        <h2>A better way to govern together</h2>
        <div className={styles.actionBar}>
          <Link href="/daos">
            <a className={styles.action}>View communities</a>
          </Link>
          <p className={styles.sub}>
            Supported by{" "}
            <a href="https://nouns.wtf" target="_blank">
              <Noggles width={50} height={50} fill={"red"} style={{ position: "relative", top: "-3px" }} />
            </a>
          </p>
        </div>
      </div>
      <Sig />
    </div>
  );
};
