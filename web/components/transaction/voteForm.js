import styles from "./voteForm.module.scss";
import { useEffect, useContext, useState } from "react";
import {
  useWaitForTransaction,
  useProvider,
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";
import useStore from "../../hooks/store/chain/useStore";
import useDAOIndex from "../../hooks/daoData";
import ParentDAOContext from "../../hooks/context/parentDAO";
import FedDelegateABI from "../../abi/f-delegate.json";
import NounishTokenABI from "../../abi/nounish-token.json";
import { parseError } from "../../lib/strings";

export default (props) => {
  const [submittedTx, setSubmittedTx] = useState(null);

  const handleCastVote = async (castVote, support, e) => {
    e.preventDefault();

    try {
      const tx = await castVote();
      setSubmittedTx(Object.assign({ support }, tx));
    } catch (ex) {
      if (!err.message.includes("user rejected transaction")) {
        // todo :- better error handling
        // will only get here if there is an onchain error
        console.error(err);
      }
    }
  };

  return !submittedTx ? (
    <CastVote {...props} handleCastVote={handleCastVote} />
  ) : (
    <Submitted {...props} activeTx={submittedTx} />
  );
};

const CastVote = (props) => {
  const account = useAccount();

  const [reason, setReason] = useState("");
  const [support, setSupport] = useState(props.activeTx.support);

  const { data: votes, isError: priorVotesErr } = useContractRead({
    addressOrName: props.parentDAO.addresses.token,
    contractInterface: NounishTokenABI,
    functionName: "getPriorVotes",
    args: [account.address, props.startBlock - 1],
  });

  const { config, err } = usePrepareContractWrite({
    addressOrName: props.parentDAO.addresses.federation,
    contractInterface: FedDelegateABI,
    functionName: "castVote",
    args: [props.id, support, reason],
  });

  const { writeAsync: castVote } = useContractWrite(config);

  const handleClick = (s) => () => {
    setSupport(s);
  };

  const handleCancel = () => {
    props.setOpen(false);
    props.onFinished();
  };

  const handleReasonChanged = (e) => {
    setReason(e.target.value);
  };

  const n = votes?.toNumber();

  return (
    <form onSubmit={props.handleCastVote.bind(this, castVote, support)}>
      <div className={styles.tx}>
        <h3>Cast Votes</h3>
        <span className={styles.tip}>
          Submit your preference on how the vote should be executed. You can only cast votes once per proposal.
        </span>
        <div className={styles.meta}>
          <label className={support == 1 ? `${styles.radio} ${styles.active}` : styles.radio}>
            <div>{n} Votes For</div>
            <input type="radio" name="radio" defaultChecked={support == 1} onClick={handleClick(1)} />
          </label>
          <label className={support == 0 ? `${styles.radio} ${styles.active}` : styles.radio}>
            <div>{n} Votes Against</div>
            <input type="radio" name="radio" defaultChecked={support == 0} onClick={handleClick(0)} />
          </label>
          <label className={support == 2 ? `${styles.radio} ${styles.active}` : styles.radio}>
            <div>{n} Votes Abstain</div>
            <input type="radio" name="radio" defaultChecked={support == 2} onClick={handleClick(2)} />
          </label>
          <label className={styles.reason}>
            <div>Reason</div>
            <textarea onChange={handleReasonChanged}></textarea>
          </label>
        </div>
      </div>
      <hr className={styles.rule} />
      <button
        type="button"
        className={`${styles.modalAction} ${styles.confirming} ${styles.cancel}`}
        onClick={handleCancel}
      >
        Cancel
      </button>
      <button type="submit" className={`${styles.modalAction} ${styles.success}`} disabled={err}>
        Submit Transaction
      </button>
      {err || priorVotesErr ? (
        <small className={styles.error}>{err ? parseError(err) : parseError(priorVotesErr)}</small>
      ) : null}
    </form>
  );
};

const supportLabel = { 0: "against", 1: "for", 2: "abstain" };
const Submitted = ({ setOpen, onFinished, activeTx, id, eDAOKey, eID, title }) => {
  const p = useProvider();
  const parentDAO = useContext(ParentDAOContext);
  const { error, isLoading, isSuccess } = useWaitForTransaction({ hash: activeTx.hash });
  const refreshProposal = useStore((state) => state.refreshProposal);
  const daoIndex = useDAOIndex();

  // refresh proposal state
  useEffect(() => {
    if (isSuccess) {
      const fn = async () => {
        refreshProposal(parentDAO.key, id, eDAOKey, eID, p);
      };

      try {
        fn();
      } catch (err) {
        // TODO :- error handling
        console.error("could not refresh proposal", err);
      }
    }
  }, [isSuccess]);

  const determineState = () => {
    if (isLoading) {
      return 0;
    }

    if (isSuccess) {
      return 1;
    }

    if (error) {
      return 2;
    }

    return 0;
  };

  const st = determineState(isLoading, isSuccess, error);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setOpen(false);
        onFinished();
      }}
    >
      <div className={styles.tx}>
        <h3>Transaction {st === 0 ? "submitted" : st === 1 ? "confirmed" : "failed"}</h3>
        <span className={styles.tip}>
          {st === 0 ? (
            <>
              Waiting for transaction to be confirmed
              <br />
            </>
          ) : (
            ""
          )}
          {st === 0 ? (
            <a href={`https://etherscan.io/tx/${activeTx.hash}`} target="_blank">
              View it on etherscan ⤴
            </a>
          ) : null}
        </span>
        <div className={styles.meta}>
          <label className={styles.txDesc}>
            {<span>Cast vote {supportLabel[activeTx.support]}</span>}
            <div
              className={(() => {
                switch (st) {
                  case 0:
                    return `${styles.circleLoader}`;
                  case 1:
                    return `${styles.circleLoader} ${styles.loadComplete}`;
                  case 2:
                    return `${styles.circleLoader} ${styles.loadError}`;
                }
              })()}
            >
              <div
                className={`${styles.checkmark} ${styles.draw}`}
                style={isSuccess ? { display: "block" } : null}
              ></div>
            </div>
          </label>
          <label>DAO</label>
          <input type="text" disabled placeholder={daoIndex[eDAOKey]?.name} />
          <label>Proposal</label>
          <input type="text" disabled placeholder={`#${eID}`} />
          <label>Title</label>
          <input type="text" disabled placeholder={title} />
        </div>
      </div>
      <button
        type="submit"
        className={(() => {
          switch (st) {
            case 0:
              return `${styles.modalAction} ${styles.confirming}`;
            case 1:
              return `${styles.modalAction} ${styles.success}`;
            case 2:
              return `${styles.modalAction} ${styles.errorBtn}`;
          }
        })()}
      >
        {st === 0 ? "Confirming..." : "Close"}
      </button>
      {error ? <small className={styles.error}>There was an error submitting this transaction</small> : null}
    </form>
  );
};
