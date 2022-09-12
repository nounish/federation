import Head from "./head";
import { motion } from "framer-motion";
import Header from "./app-header";
import styles from "./app.module.scss";

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
        <Header hasBreadCrumbs={props.hasBreadCrumbs} />
        <main className={styles.m}>{props.children}</main>
      </motion.div>
      <style global jsx>{`
        body {
          background: #f7fafc;
        }
      `}</style>
    </>
  );
};
