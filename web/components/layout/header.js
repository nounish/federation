import { GitHub, Twitter } from "../icons";
import styles from "./header.module.scss";
import Link from "next/link";
import { RightArrow } from "../icons";

export default () => {
  return (
    <>
      <div className={styles.announcement}>
        <span>
          Bid on Nouns DAO votes{"! "}
          <a href="https://bids.federation.wtf" target="_blank">
            Learn more{" "}
            <span style={{ display: "inline flow-root list-item", marginLeft: "5px" }}>
              <RightArrow />
            </span>
          </a>
        </span>
      </div>
      <header className={styles.header}>
        <div>
          <Link href="/">
            <a className={styles.logo}>
              <h1>Federation</h1>
            </a>
          </Link>
        </div>
        <nav>
          <ul>
            <li>
              <Link href="/daos">
                <a>Explore</a>
              </Link>
            </li>
            <li>
              <Link href="/faq">
                <a>FAQ</a>
              </Link>
            </li>
            <li>
              <a href="https://twitter.com/0xWiz_" target="_blank">
                <Twitter width={20} height={20} />
              </a>
            </li>
            <li>
              <a href="https://github.com/nounish/federation" target="_blank">
                <GitHub width={20} height={20} />
              </a>
            </li>
          </ul>
        </nav>
      </header>
    </>
  );
};
