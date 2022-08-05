import Head from "./head";
import { motion } from "framer-motion";
import Header from "./header";
import styles from "./home.module.scss";
import Sig from "../sig/sig";

const variants = {
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      type: "ease-in",
    },
  },
  hidden: {
    opacity: 0,
    transition: {
      duration: 0.2,
      type: "ease-out",
    },
  },
};

export default (props) => {
  return (
    <>
      <Head {...props} />
      <motion.div variants={variants} initial="hidden" animate="visible" className={styles.w}>
        <Header />
        <main className={styles.m}>{props.children}</main>
        <Sig />
      </motion.div>
    </>
  );
};
