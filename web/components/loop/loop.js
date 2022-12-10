import { AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import styles from "./loop.module.scss";

export default ({ dims, children, delay = 1200 }) => {
  const [index, setIndex] = useState(0);
  const counter = useRef(0);

  useEffect(() => {
    let idx = 0;
    // start counter at 0 and rollover at children length
    counter.current = (counter.current + 1) % children.length;

    if (children.length == 2) {
      // if there are only two children, we want to alternate between them
      idx = counter.current == 0 ? 1 : 0;
      if (index == idx) {
        idx = counter.current;
      }
    } else {
      idx = counter.current;
    }

    const tick = setTimeout(() => {
      setIndex(idx);
    }, delay);
    return () => clearTimeout(tick);
  }, [index]);

  const { width, height } = dims[index];

  return (
    <AnimatePresence>
      <div className={styles.loop} style={{ width, height }}>
        {children[index]}
      </div>
    </AnimatePresence>
  );
};
