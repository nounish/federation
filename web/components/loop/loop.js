import { AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import styles from "./loop.module.scss";

export default ({ dims, children, delay = 1200 }) => {
  const [index, setIndex] = useState(0);
  const counter = useRef(-1);

  useEffect(() => {
    // start counter at 0 and rollover at children length
    counter.current = (counter.current + 1) % children.length;
    const tick = setTimeout(() => setIndex(counter.current), delay);
    return () => clearTimeout(tick);
  }, [index]);

  const { width, height } = dims[index];

  return (
    <div className={styles.loop} style={{ width, height }}>
      <AnimatePresence>{children[index]}</AnimatePresence>
    </div>
  );
};
