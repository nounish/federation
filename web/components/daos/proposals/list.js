import Item from "./item";
import EmptyState from "./emptyState";
import NetworkInfo from "./networkInfo";
import styles from "./list.module.scss";
import { ScaleLoader } from "react-spinners";

export default ({ props, fedMeta, dao, loading }) => {
  const executed = props.filter((p) => p.executed);
  const active = props.filter((p) => !p.executed);
  const isEmpty = active.length === 0;

  return (
    <div className="container">
      <NetworkInfo dao={dao} fedMeta={fedMeta} />
      <div className={styles.list}>
        <span className={styles.listFilterBar}>External proposals ({active.length})</span>
        {loading ? (
          <div className={styles.loading}>
            <ScaleLoader color="#000" height={20} width={3} speedMultiplier={2} />
          </div>
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          active.map((item, id) => {
            return <Item key={id} {...item} dao={dao} fedMeta={fedMeta} />;
          })
        )}
      </div>
      {executed.length ? (
        <div className={styles.list}>
          <br />
          <span className={styles.listFilterBar}>Executed votes ({executed.length})</span>
          {executed
            .map((item, id) => {
              return <Item key={id} {...item} dao={dao} fedMeta={fedMeta} executed />;
            })
            .reverse()}
        </div>
      ) : null}
    </div>
  );
};
