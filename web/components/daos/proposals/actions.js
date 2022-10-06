import styles from "./actions.module.scss";
import { useState, useContext, useEffect } from "react";
import { useContractWrite, usePrepareContractWrite, useAccount, useContractRead } from "wagmi";
import { ArrowUp, ArrowDown, XCircle, AlertCircle } from "react-feather";
import Popup from "../../transaction/popup";
import ProposeForm from "../../transaction/proposeForm";
import VoteForm from "../../transaction/voteForm";
import FedDelegateABI from "../../../abi/f-delegate.json";
import ParentDAOContext from "../../../hooks/context/parentDAO";
import { Loader } from "../../icons";

const errorMsgRegex = /'(.*?)'/g;
const parseError = (error) => {
  if (error?.reason === "") {
    return "";
  }

  // capitalize error message
  const msg = error.reason?.match(errorMsgRegex);
  if (msg) {
    let ret = msg[0].replaceAll("'", "");
    return ret.charAt(0).toUpperCase() + ret.slice(1);
  }

  const reversionMsg = error.reason?.replace("execution reverted: ", "");
  if (reversionMsg) {
    return reversionMsg.charAt(0).toUpperCase() + reversionMsg.slice(1);
  }

  console.error("parseError", error);
  return "An error occured";
};

const Vote = (props) => {
  const parentDAO = useContext(ParentDAOContext);
  const account = useAccount();
  const [err, setErr] = useState("");

  // get federation proposal receipts to check if this user has previously voted
  const { data: userVote, refetch } = useContractRead({
    addressOrName: parentDAO.addresses.federation,
    contractInterface: FedDelegateABI,
    functionName: "getReceipt",
    args: [props.id, account.address],
  });

  useEffect(() => {
    refetch();
  }, [props.forVotes, props.againstVotes, props.abstainVotes]);

  // ignore prior votes not yet determined error which can show up if user
  // has started a vote but tx has not been mined
  const isDisabled = (() => {
    if (parseError(err || { reason: "" }).includes("not yet determined")) {
      if (userVote?.hasVoted) {
        return true;
      }

      return false;
    }

    return userVote?.hasVoted || err;
  })();

  return (
    <div className={styles.details}>
      <ul className={styles.actionList}>
        <VoteAction
          setErr={setErr}
          disabled={isDisabled}
          className={`${styles.for} action`}
          pID={props.id}
          support={1}
          userVoted={(userVote?.support || -1) === 1}
          handleTx={props.handleTx}
        >
          <ArrowUp size={21} />
          {props.forVotes}
        </VoteAction>
        <VoteAction
          setErr={setErr}
          disabled={isDisabled}
          className={`${styles.against} action`}
          pID={props.id}
          support={0}
          userVoted={userVote?.hasVoted && userVote?.support === 0}
          handleTx={props.handleTx}
        >
          <ArrowDown size={21} /> {props.againstVotes}
        </VoteAction>
        <VoteAction
          setErr={setErr}
          disabled={isDisabled}
          className={`${styles.abstain} action`}
          pID={props.id}
          support={2}
          userVoted={(userVote?.support || -1) === 2}
          handleTx={props.handleTx}
        >
          <XCircle size={19} /> {props.abstainVotes}
        </VoteAction>
      </ul>
      {err ? (
        // ignore prior votes not yet determined error which can show up if user
        // has started a vote but tx has not been mined
        parseError(err).includes("not yet determined") ? null : (
          <div className={styles.errorMsgVote}>
            <AlertCircle size={18} style={{ color: "red" }} />
            {parseError(err)}
          </div>
        )
      ) : null}
    </div>
  );
};

const VoteAction = (props) => {
  const parentDAO = useContext(ParentDAOContext);
  const { config, error } = usePrepareContractWrite({
    addressOrName: parentDAO.addresses.federation,
    contractInterface: FedDelegateABI,
    functionName: "castVote",
    args: [props.pID, props.support, ""],
  });

  const { writeAsync, isLoading } = useContractWrite(config);

  // bubble error to parent
  useEffect(() => {
    props.setErr(error);
  }, [error]);

  const handleClick = async (e) => {
    e.preventDefault();

    try {
      let tx = await writeAsync();
      tx = Object.assign({}, tx, { support: props.support });
      props.handleTx(tx);
    } catch (err) {
      if (!err.message.includes("user rejected transaction")) {
        // todo :- better error handling
        // will only get here if there is an onchain error
        console.error(err);
      }
    }
  };

  const isDisabled = props.disabled || !writeAsync;
  return (
    <li onClick={handleClick}>
      <button
        disabled={isDisabled}
        className={
          isLoading
            ? `${styles.loading} ${styles.actionBtn} ${props.className}`
            : props.userVoted
            ? `${styles.actionBtn} ${props.className} ${styles.active}`
            : `${styles.actionBtn} ${props.className}`
        }
      >
        <span className={isLoading ? styles.hidden : ""}>{props.children}</span>
        <span className={isLoading ? `${styles.visible} ${styles.loader}` : styles.loader}>
          <Loader />
        </span>
      </button>
    </li>
  );
};

const Propose = (props) => {
  const parentDAO = useContext(ParentDAOContext);

  const { config, error } = usePrepareContractWrite({
    addressOrName: parentDAO.addresses.federation,
    contractInterface: FedDelegateABI,
    functionName: "propose",
    args: [props.eDAO, props.eID],
  });

  const { writeAsync, isLoading } = useContractWrite(config);

  const handleClick = async (e) => {
    e.preventDefault();
    if (e.target.closest("#start")) {
      try {
        const tx = await writeAsync();
        props.handleTx(tx);
      } catch (err) {
        if (!err.message.includes("user rejected transaction")) {
          // todo :- better error handling
          // will only get here if there is an onchain error
          console.error(err);
        }
      }
    }
  };

  const isDisabled = error || !writeAsync;

  return (
    <div className={styles.actionWrapper} onClick={handleClick}>
      {(() => {
        if (error) {
          return (
            <>
              <button id="start" className={`${styles.propose} ${styles.disabled}`} disabled>
                <span>Start Vote</span>
              </button>
              {/* <div className={styles.errorMsg}>
                <AlertCircle size={18} style={{ color: "red" }} />
                {parseError(error)}
              </div> */}
            </>
          );
        }

        return (
          <button id="start" disabled={isDisabled} className={styles.propose}>
            <span className={isLoading ? styles.hidden : ""}>Start Vote</span>
            <span className={isLoading ? `${styles.visible} ${styles.loader}` : styles.loader}>
              <Loader />
            </span>
          </button>
        );
      })()}
    </div>
  );
};

const Execute = (props) => {
  const parentDAO = useContext(ParentDAOContext);

  const { config, error } = usePrepareContractWrite({
    addressOrName: parentDAO.addresses.federation,
    contractInterface: FedDelegateABI,
    functionName: "execute",
    args: [props.id],
  });

  const { writeAsync, isLoading } = useContractWrite(config);

  const handleClick = async (e) => {
    e.preventDefault();
    if (e.target.closest("#start")) {
      try {
        const tx = await writeAsync();
        props.handleTx(tx);
      } catch (err) {
        if (!err.message.includes("user rejected transaction")) {
          // todo :- better error handling
          // will only get here if there is an onchain error
          console.error(err);
        }
      }
    }
  };

  const isDisabled = error || !writeAsync;
  let parsedError = parseError(error || { reason: "" });
  let ignoreErr = false;
  if (parsedError.includes("execution window")) {
    ignoreErr = true;
  }

  return (
    <div className={styles.actionWrapper} onClick={handleClick}>
      {(() => {
        if (error) {
          return (
            <>
              <button id="start" className={`${styles.propose} ${styles.disabled}`} disabled>
                <span>Execute</span>
              </button>
              {!ignoreErr ? (
                <div className={styles.errorMsg}>
                  <AlertCircle size={18} style={{ color: "red" }} />
                  {parsedError}
                </div>
              ) : null}
            </>
          );
        }

        return (
          <button id="start" disabled={isDisabled} className={`${styles.propose} ${styles.execute}`}>
            <span className={isLoading ? styles.hidden : ""}>Execute</span>
            <span className={isLoading ? `${styles.visible} ${styles.loader}` : styles.loader}>
              <Loader />
            </span>
          </button>
        );
      })()}
    </div>
  );
};

const txTypes = ["propose", "vote", "execute"];
const Actions = (props) => {
  const [open, setOpen] = useState(false);
  const [activeTx, setActiveTx] = useState(null);
  const [txTypeInFlight, setTxTypeInFlight] = useState("");

  const handleTx = (txType) => async (tx) => {
    setOpen(true);
    setActiveTx(tx);
    setTxTypeInFlight(txType);
  };

  const clearTxInFlight = () => {
    setTxTypeInFlight("");
  };

  return (
    <>
      <Popup open={open} setOpen={setOpen}>
        {txTypeInFlight === txTypes[1] ? (
          <VoteForm {...props} setOpen={setOpen} onFinished={clearTxInFlight} activeTx={activeTx} txType={txTypes[1]} />
        ) : props.proposed && txTypeInFlight === txTypes[2] ? (
          <VoteForm {...props} setOpen={setOpen} onFinished={clearTxInFlight} activeTx={activeTx} txType={txTypes[2]} />
        ) : (
          <ProposeForm {...props} setOpen={setOpen} onFinished={clearTxInFlight} activeTx={activeTx} />
        )}
      </Popup>
      {props.proposed ? (
        props.isExecutable ? (
          <Execute {...props} handleTx={handleTx(txTypes[2])} id={props.id} />
        ) : (
          <Vote {...props} handleTx={handleTx(txTypes[1])} id={props.id} />
        )
      ) : (
        <Propose handleTx={handleTx(txTypes[0])} eDAO={props.eDAO} eID={props.eID} />
      )}
    </>
  );
};

export default Actions;
