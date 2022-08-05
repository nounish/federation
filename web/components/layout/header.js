import { GitHub, Twitter } from "../icons";
import styles from "./header.module.scss";
import Link from "next/link";

export default () => {
  return (
    <header className={styles.header}>
      <div className="mast">
        <Link href="/">
          <a>
            <h1>Federation</h1>
          </a>
        </Link>
      </div>
      <nav>
        <ul>
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
  );
};
