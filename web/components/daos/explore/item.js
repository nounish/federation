import { ethers } from "ethers";
import styles from "./item.module.scss";
import { RightArrow } from "../../../components/icons";
import Link from "next/link";
import { cleanURL } from "../../../lib/strings";
import { useProvider } from "wagmi";
import useStore from "../../../hooks/store/chain/useStore";
import { useEffect } from "react";

export default (props) => {
  const provider = useProvider();

  const treasuryBalance = useStore((state) => {
    return state[props.daoKey]?.treasury.balance;
  });

  const getTreasuryMeta = useStore((state) => state.getTreasuryMeta);
  useEffect(() => {
    if (props.addresses.treasury === ethers.constants.AddressZero) return;
    getTreasuryMeta(props.daoKey, provider);
  }, []);

  const handleClick = (e) => {
    if (props.soon) {
      e.preventDefault();
      return;
    }

    if (e.target.tagName === "A") {
      e.preventDefault();
      window.open(e.target.href, "_blank");
    }
  };

  return (
    <Link href={`/daos/${props.daoKey}`}>
      <span onClick={handleClick} className={props.soon ? `${styles.sp} ${styles.soon}` : `${styles.sp}`}>
        <div className={styles.item}>
          <div>
            <h2>{props.displayName}</h2>
            <span className={styles.description}>{props.description}</span>
            <div className="details">
              <ul style={{ padding: "0" }}>
                {props.addresses.treasury !== ethers.constants.AddressZero ? <li>Ξ {treasuryBalance}</li> : null}
                <li className={styles.external}>
                  <a href={props.website} target="_blank">
                    {cleanURL(props.website)}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className={styles.o}>
            <RightArrow width="22px" />
          </div>
        </div>
      </span>
    </Link>
  );
};
