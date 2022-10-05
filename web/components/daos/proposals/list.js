import Item from "./item";
import EmptyState from "./emptyState";
import styles from "./list.module.scss";

export default ({ props, fedMeta }) => {
  const executed = props.filter((p) => p.executed);
  const active = props.filter((p) => !p.executed);
  const isEmpty = active.length === 0;

  return (
    <div className="container">
      <div className={styles.list}>
        <span className={styles.listFilterBar}>External proposals ({active.length})</span>
        {isEmpty ? (
          <EmptyState />
        ) : (
          active.map((item, id) => {
            return <Item key={id} {...item} fedMeta={fedMeta} />;
          })
        )}
      </div>
      {executed.length ? (
        <div className={styles.list}>
          <span className={styles.listFilterBar}>Executed votes ({executed.length})</span>
          {executed.map((item, id) => {
            return <Item key={id} {...item} fedMeta={fedMeta} executed />;
          })}
        </div>
      ) : null}
    </div>
  );
};
