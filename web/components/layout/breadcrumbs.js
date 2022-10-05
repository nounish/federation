import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./breadcrumbs.module.scss";
import { RightArrow } from "../icons";
import useDAOIndex from "../../hooks/daoData";

export default () => {
  const router = useRouter();
  const daoIndex = useDAOIndex();

  const { name } = router.query;
  if (!name) return null;

  const d = daoIndex[name];
  const indStyle = { backgroundColor: d.ind };

  return (
    <>
      <nav className={`${styles.b} ${styles.bb}`}>
        <ul>
          <li>
            <Link href="/daos">
              <a>
                <span className={styles.flip}>
                  <RightArrow />
                </span>
                Explore
              </a>
            </Link>
          </li>
          <li>/</li>
          <li className={styles.dao}>
            <div className={styles.ping}>
              <div className={styles.dot} style={{ position: "absolute", ...indStyle }}></div>
              <div className={`${styles.dot}`} style={indStyle}></div>
            </div>
            <Link href={`/daos/${name}`}>
              <a>{d.displayName}</a>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
};
