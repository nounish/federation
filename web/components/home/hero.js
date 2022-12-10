import Link from "next/link";
import { Noggles, LilNoggles } from "../icons";
import styles from "./hero.module.scss";
import Sig from "../sig";
import Loop from "../loop/loop";
import { motion } from "framer-motion";

const variants = {
  init: {
    opacity: 0,
    top: -8,
    transition: {
      duration: 0.33,
      type: "ease",
    },
  },
  enter: {
    opacity: 1,
    top: -2,
    transition: {
      duration: 0.22,
      type: "ease-in",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.33,
      type: "ease-out",
    },
  },
};

const dims = [
  { width: 50, height: 25 },
  { width: 50, height: 25 },
];

const SupporterLoop = () => (
  <Loop dims={dims} delay={3600}>
    <motion.div style={{ position: "relative" }} key="1" variants={variants} initial="init" animate="enter" exit="exit">
      <a href="https://nouns.wtf" target="_blank">
        <Noggles width={50} height={50} fill={"red"} style={{ position: "absolute", left: 0, top: -6 }} />
      </a>
    </motion.div>
    <motion.div style={{ position: "relative" }} key="2" variants={variants} initial="init" animate="enter" exit="exit">
      <a href="https://lilnouns.wtf" target="_blank">
        <LilNoggles width={80} height={80} style={{ position: "absolute", left: -10, top: -19 }} />
      </a>
    </motion.div>
  </Loop>
);

export default () => {
  return (
    <div className={styles.w}>
      <div className={styles.emp}>
        <Link href="/faq">
          <a className={styles.pill}>
            Questions? ⋅ Learn more <span>→</span>
          </a>
        </Link>
        <h2>A better way to govern together</h2>
        <div className={styles.actionBar}>
          <Link href="/daos">
            <a className={styles.action}>View communities</a>
          </Link>
          <div className={styles.sub}>
            Supported by <SupporterLoop />
          </div>
        </div>
      </div>
      <Sig />
    </div>
  );
};
