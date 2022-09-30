import styles from "./proposeForm.module.scss";
import { useEffect, useContext } from "react";
import { useWaitForTransaction, useProvider } from "wagmi";
import { ethers } from "ethers";
import useStore from "../../hooks/store/chain/useStore";
import FDelegateABI from "../../abi/f-delegate.json";
import ParentDAOContext from "../../hooks/context/parentDAO";
import useDAOIndex from "../../hooks/daoData";

const parsePropIDFromCreatedLog = (contract, logs = []) => {
  for (let log in logs) {
    const parsed = contract.interface.parseLog(logs[log]);
    if (parsed.name === "ProposalCreated") {
      return parsed.args.id.toNumber();
    }
  }

  return 0;
};

export default ({ setOpen, onFinished, activeTx, eDAOKey, eID, title }) => {
  const p = useProvider();
  const parentDAO = useContext(ParentDAOContext);
  const { data, error, isLoading, isSuccess } = useWaitForTransaction({ hash: activeTx.hash });
  const setProposalProposed = useStore((state) => state.setProposalProposed);
  const refreshProposal = useStore((state) => state.refreshProposal);
  const daoIndex = useDAOIndex();

  // update proposal state in store when the tx is confirmed
  useEffect(() => {
    if (isSuccess) {
      const fn = async () => {
        const c = new ethers.Contract(data.to, FDelegateABI, p);
        const pID = parsePropIDFromCreatedLog(c, data.logs);
        if (!pID) {
          console.error("could not parse proposal id from logs");
          return;
        }

        await setProposalProposed(parentDAO.key, pID, eDAOKey, eID);

        refreshProposal(parentDAO.key, pID, eDAOKey, eID, p);
      };

      try {
        fn();
      } catch (err) {
        // TODO :- error handling
        console.error(err);
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
            <span>Start Vote</span>
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
