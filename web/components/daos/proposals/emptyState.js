import styles from "./emptyState.module.scss";

export default () => {
  return (
    <div className={styles.w}>
      <span>No active external proposals</span>
    </div>
  );
};
