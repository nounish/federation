import styles from "./item.module.scss";
import { RightArrow } from "../../../components/icons";
import Link from "next/link";
import { cleanName, cleanURL } from "../../../lib/strings";
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
    getTreasuryMeta(props.daoKey, provider);
  }, []);

  const handleClick = (e) => {
    if (e.target.tagName === "A") {
      e.preventDefault();
      window.open(e.target.href, "_blank");
    }
  };

  return (
    <Link href={`/daos/${cleanName(props.name)}`}>
      <span onClick={handleClick} className={styles.sp}>
        <div className={styles.item}>
          <div>
            <h2>{props.name}</h2>
            <div className="details">
              <ul>
                <li>Ξ {treasuryBalance}</li>
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
