import styles from "./actions.module.scss";
import { ethers } from "ethers";
import { useState, useContext, useEffect } from "react";
import { useContractWrite, usePrepareContractWrite, useAccount, useContractRead, useProvider } from "wagmi";
import { ArrowUp, ArrowDown, XCircle, AlertCircle } from "react-feather";
import useStore from "../../../hooks/store/chain/useStore";
import Popup from "../../transaction/popup";
import ProposeForm from "../../transaction/proposeForm";
import VoteForm from "../../transaction/voteForm";
import FedDelegateABI from "../../../abi/f-delegate.json";
import FedMultiTypeDelegateABI from "../../../abi/f-mt-delegate.json";
import BuilderTokenABI from "../../../abi/builder-token.json";
import NounishTokenABI from "../../../abi/nounish-token.json";
import ParentDAOContext from "../../../hooks/context/parentDAO";
import { Loader } from "../../icons";
import { parseError } from "../../../lib/strings";

const Vote = (props) => {
  const account = useAccount();

  // get federation proposal receipts to check if this user has previously voted
  const { data: userVote, refetch } = useContractRead({
    addressOrName: props.parentDAO.addresses.federation,
    contractInterface: FedDelegateABI,
    functionName: "getReceipt",
    args: [props.id, account.address],
  });

  // refetch if votes changed in state
  useEffect(() => {
    refetch();
  }, [props.forVotes, props.againstVotes, props.abstainVotes]);

  const isDisabled = userVote?.hasVoted || !account.address;

  return (
    <div className={styles.details}>
      <ul className={styles.actionList}>
        <VoteAction
          className={`${styles.for} action`}
          disabled={isDisabled}
          pID={props.id}
          support={1}
          userVoted={(userVote?.support || -1) === 1}
          handleTx={props.handleTx}
        >
          <ArrowUp size={21} />
          {props.forVotes}
        </VoteAction>
        <VoteAction
          className={`${styles.against} action`}
          disabled={isDisabled}
          pID={props.id}
          support={0}
          userVoted={userVote?.hasVoted && userVote?.support === 0}
          handleTx={props.handleTx}
        >
          <ArrowDown size={21} /> {props.againstVotes}
        </VoteAction>
        <VoteAction
          className={`${styles.abstain} action`}
          disabled={isDisabled}
          pID={props.id}
          support={2}
          userVoted={(userVote?.support || -1) === 2}
          handleTx={props.handleTx}
        >
          <XCircle size={19} /> {props.abstainVotes}
        </VoteAction>
      </ul>
    </div>
  );
};

const VoteAction = (props) => {
  const handleClick = async (e) => {
    e.preventDefault();
    props.handleTx({ pID: props.pID, support: props.support });
  };

  return (
    <li onClick={handleClick}>
      <button
        disabled={props.disabled}
        className={
          props.userVoted
            ? `${styles.actionBtn} ${props.className} ${styles.active}`
            : `${styles.actionBtn} ${props.className}`
        }
      >
        <span>{props.children}</span>
      </button>
    </li>
  );
};

const Propose = (props) => {
  const { config, error } = usePrepareContractWrite({
    addressOrName: props.parentDAO.addresses.federation,
    contractInterface: props.parentDAO.builderDAO ? FedMultiTypeDelegateABI : FedDelegateABI,
    functionName: "propose",
    args: props.parentDAO.builderDAO
      ? [
          props.eDAO,
          typeof props.eID === "number" ? ethers.utils.hexZeroPad(ethers.utils.hexlify(props.eID), 32) : props.eID, // convert nounish dao prop ids to bytes32
          typeof props.eID === "number" ? 0 : 1, // 0 = nounish dao, 1 = builder dao
        ]
      : [props.eDAO, props.eID],
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
  const { config, error } = usePrepareContractWrite({
    addressOrName: props.parentDAO.addresses.federation,
    contractInterface: props.parentDAO.multiType ? FedMultiTypeDelegateABI : FedDelegateABI,
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
  const p = useProvider();
  const refreshProposal = useStore((state) => state.refreshProposal);
  const parentDAO = useContext(ParentDAOContext);

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
    // when popup closes refresh the proposal data
    refreshProposal(parentDAO.key, props.id, props.eDAOKey, props.eID, p);
  };

  return (
    <>
      <Popup open={open} setOpen={setOpen}>
        {txTypeInFlight === txTypes[1] ? (
          <VoteForm
            {...props}
            parentDAO={parentDAO}
            setOpen={setOpen}
            onFinished={clearTxInFlight}
            activeTx={activeTx}
          />
        ) : props.proposed && txTypeInFlight === txTypes[2] ? (
          <ProposeForm
            {...props}
            setOpen={setOpen}
            onFinished={clearTxInFlight}
            activeTx={activeTx}
            txType={txTypes[2]}
          />
        ) : (
          <ProposeForm
            {...props}
            setOpen={setOpen}
            onFinished={clearTxInFlight}
            activeTx={activeTx}
            txType={txTypes[0]}
          />
        )}
      </Popup>
      {props.proposed ? (
        props.isExecutable ? (
          <Execute {...props} parentDAO={parentDAO} handleTx={handleTx(txTypes[2])} id={props.id} />
        ) : (
          <Vote {...props} parentDAO={parentDAO} handleTx={handleTx(txTypes[1])} id={props.id} />
        )
      ) : (
        <Propose parentDAO={parentDAO} handleTx={handleTx(txTypes[0])} eDAO={props.eDAO} eID={props.eID} />
      )}
    </>
  );
};

export default Actions;
