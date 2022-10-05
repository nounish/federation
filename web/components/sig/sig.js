import { motion } from "framer-motion";
import Loop from "../loop/loop";
import styles from "./sig.module.scss";

const variants = {
  init: {
    opacity: 0,
    transition: {
      duration: 0.2,
      type: "ease",
    },
  },
  enter: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.2,
      type: "ease",
    },
  },
  exit: {
    x: 0,
    opacity: 0,
    transition: {
      duration: 0.25,
      type: "linear",
    },
  },
};

const dims = [
  { width: 20, height: 16 },
  { width: 20, height: 16 },
  { width: 20, height: 16 },
];

const TextLoop = () => (
  <Loop dims={dims}>
    <motion.div key="1" variants={variants} initial="init" animate="enter" exit="exit">
      <span>🌎</span>
    </motion.div>
    <motion.div key="2" variants={variants} initial="init" animate="enter" exit="exit">
      <span>🌍</span>
    </motion.div>
    <motion.div key="3" variants={variants} initial="init" animate="enter" exit="exit">
      <span>🌏</span>
    </motion.div>
  </Loop>
);

export default () => {
  return (
    <div className={styles.sig}>
      <div>
        Federation is Public Infrastructure <TextLoop />
      </div>
      <div className={styles.b}>
        Built by{" "}
        <a href="https://twitter.com/0xWiz_" target="_blank">
          wiz ⌐◨-◨
        </a>
      </div>
      <div className={`${styles.cs} hidden-mobile`}>Public Beta</div>
    </div>
  );
};
