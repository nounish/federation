import styles from "./faq.module.scss";
import { Accordion } from "react-bootstrap";
import parse from "html-react-parser";

export default ({ item, i }) => {
  return (
    <Accordion.Item eventKey={`${i}`} className={styles.item}>
      <Accordion.Header className={styles.header}>{item.title}</Accordion.Header>
      <Accordion.Body className={styles.body}>{parse(item.body)}</Accordion.Body>
    </Accordion.Item>
  );
};
