import { GitHub, Twitter } from "../icons";
import styles from "./app-header.module.scss";
import Link from "next/link";
import ConnectButton from "../rainbow/connect-button";
import Breadcrumbs from "./breadcrumbs";

export default ({ hasBreadCrumbs = false }) => {
  return (
    <>
      <header className={styles.header} style={!hasBreadCrumbs ? { borderBottom: "1px solid #E3E8EE" } : null}>
        <div>
          <Link href="/">
            <a>
              <h1>Federation</h1>
              <span style={{ fontSize: "80%", fontWeight: "normal", margin: "0 0 0 5px" }}> BETA</span>
            </a>
          </Link>
        </div>
        <nav>
          <ul>
            <li>
              <ConnectButton />
            </li>
          </ul>
        </nav>
      </header>
      <Breadcrumbs />
    </>
  );
};
