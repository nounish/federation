import styles from "./list.module.scss";
import dynamic from "next/dynamic";

// don't render items on the server to avoid hydration errors getting treasury
// balance
const Item = dynamic(() => import("./item"), { ssr: false });

export default ({ items }) => {
  const comingSoon = items
    .map((item, i) => {
      if (item.released) return null;
      return <Item key={i} {...item} daoKey={item.key} soon />;
    })
    .filter((f) => f);

  return (
    <>
      <div className={styles.mast}>
        <h1>Explore</h1>
        <span>Discover communities that have integrated Federation to manage cross-DAO governance.</span>
      </div>
      <div className={styles.daos}>
        {items
          .map((item, i) => {
            if (!item.released) return null;
            return <Item key={i} {...item} daoKey={item.key} />;
          })
          .filter((f) => f)}
      </div>
      {comingSoon.length ? (
        <div className={`${styles.daos}`}>
          <span className={styles.cs}>Coming Soon</span>
          <div className={styles.soon}>{comingSoon}</div>
        </div>
      ) : null}
    </>
  );
};
