import styles from "./list.module.scss";
import dynamic from "next/dynamic";

// don't render items on the server to avoid hydration errors getting treasury
// balance
const Item = dynamic(() => import("./item"), { ssr: false });

export default ({ items }) => {
  return (
    <>
      <div className={styles.mast}>
        <h1>Explore</h1>
        <span>Discover communities that have integrated Federation to manage external governance.</span>
      </div>
      <div className={styles.daos}>
        {items.map((item, i) => {
          return <Item key={i} {...item} daoKey={item.key} />;
        })}
      </div>
    </>
  );
};
