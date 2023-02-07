import styles from "./item.module.scss";
import Proposer from "./proposer";
import Actions from "./actions";
import useDAOIndex from "../../../hooks/daoData";
import { ETA, ETATS } from "./eta";
import { Users } from "react-feather";

const GetState = ({ forVotes, againstVotes, abstainVotes }) => {
  let s = "Undecided";

  if (abstainVotes > forVotes && abstainVotes > againstVotes) {
    s = "Abstain";
  }

  if (againstVotes > forVotes) {
    s = "Against";
  }

  if (forVotes > againstVotes) {
    s = "For";
  }

  return s;
};

const Support = (props) => {
  const s = GetState(props);
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
        if (props.dao.multiType) {
          if (props.builderDAO) {
            const currentTimestamp = props.fedMeta.blockTimestamp;

            if (currentTimestamp >= props.endTimestamp - props.fedMeta.execWindowSecs) {
              if (GetState(props) !== "Undecided") {
                return true;
              }
            }

            return false;
          }

          if (props.fedMeta.currentBlock >= props.endBlock - props.fedMeta.execWindowBlocks) {
            if (GetState(props) !== "Undecided") {
              return true;
            }
          }

          return false;
        }

        if (props.fedMeta.currentBlock >= props.endBlock - props.fedMeta.execWindow) {
          if (GetState(props) !== "Undecided") {
            return true;
          }
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
              {!props.executed && props.proposed ? (
                <Quorum quorumVotes={props.quorumVotes} />
              ) : props.proposed ? (
                <Support {...props} />
              ) : null}
            </div>
          </div>
          <span className={styles.time}>
            {!props.executed ? (
              props.builderDAO ? (
                <ETATS
                  endTimestamp={props.externalEndTimestamp}
                  isExecutable={isExecutable}
                  execWindowSecs={props.fedMeta.execWindowSecs}
                  currentTimestamp={props.fedMeta.blockTimestamp}
                />
              ) : (
                <ETA
                  endBlock={props.externalEndBlock}
                  isExecutable={isExecutable}
                  execWindow={props.dao.multiType ? props.fedMeta.execWindowBlocks : props.fedMeta.execWindow}
                />
              )
            ) : null}
          </span>
          <h3 style={props.executed ? { marginBottom: 0 } : null}>
            {(() => {
              if (props.builderDAO) {
                return <>{props.title}</>;
              }

              return (
                <>
                  <span className={styles.propid}>#{props.eID}</span>
                  {props.title}
                </>
              );
            })()}
          </h3>
          {!props.executed ? <Actions {...props} isExecutable={isExecutable} /> : null}
        </div>
      </span>
    </a>
  );
};
