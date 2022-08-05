import { RightArrow } from "../icons";
import styles from "./hero.module.scss";

export default ({ title, subtitle }) => {
  return (
    <div className={styles.w}>
      <h2 className="n">DAO to DAO governance rails</h2>
      <p className={styles.subtitle}>
        Federation provides solutions for communities in the Nouns ecosystem to participate in governance with one
        another.
        <font style={{ color: "rgb(139, 140, 150)" }}> Collect. Connect. Govern.</font>
      </p>
      <a
        href="https://federation.notion.site/Federation-50a43c58faba4e37a5b7122cc0fbbd3d"
        target="_blank"
        className={styles.action}
      >
        Read the litepaper <RightArrow width="20px" />
      </a>
    </div>
  );
};
