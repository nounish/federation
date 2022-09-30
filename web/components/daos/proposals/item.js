import styles from "./item.module.scss";
import Proposer from "./proposer";
import ETA from "./eta";
import Actions from "./actions";
import { Users } from "react-feather";
import useDAOIndex from "../../../hooks/daoData";

const Support = ({ forVotes, againstVotes, abstainVotes }) => {
  let s = "";
  if (abstainVotes > forVotes && abstainVotes > againstVotes) {
    s = "Abstain";
  }

  if (againstVotes > forVotes) {
    s = "Against";
  }

  if (forVotes > againstVotes) {
    s = "For";
  }

  return <span className={`${styles.support} ${styles[s.toLowerCase()]}`}>{s}</span>;
};

const Quorum = ({ quorumVotes }) => {
  return (
    <>
      <Users size={16} />
      {quorumVotes}
    </>
  );
};

export default (props) => {
  const daoIndex = useDAOIndex();

  const isExecutable = (() => {
    if (props.proposed) {
      if (props.votes >= props.quorumVotes && props.votes > 0) {
        if (props.fedMeta.currentBlock >= props.endBlock - props.fedMeta.execWindow) {
          return true;
        }
      }
    }

    return false;
  })();

  const d = daoIndex[props.eDAOKey];

  return (
    <a className={styles.iw} target="_blank" href={`${d.dao}${props.eID}`}>
      <span>
        <div className={props.executed ? `${styles.item} ${styles.executed}` : styles.item}>
          <div className={styles.topBar}>
            <div className={styles.proposer}>
              <div>
                <span className={styles.edao}>{d.name}</span>
              </div>
              <div>&middot;</div>
              <Proposer addr={props.eProposer} />
            </div>
            <div className={styles.quorum}>
              {!props.executed && props.proposed ? <Quorum quorumVotes={props.quorumVotes} /> : <Support {...props} />}
            </div>
          </div>
          <span className={styles.time}>
            {!props.executed ? (
              <ETA
                endBlock={props.externalEndBlock}
                isExecutable={isExecutable}
                execWindow={props.fedMeta.execWindow}
              />
            ) : null}
          </span>
          <h3 style={props.executed ? { marginBottom: 0 } : null}>
            <span className={styles.propid}>#{props.eID}</span> {props.title}
          </h3>
          {!props.executed ? <Actions {...props} isExecutable={isExecutable} /> : null}
        </div>
      </span>
    </a>
  );
};
