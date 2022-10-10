import styles from "./dao.module.scss";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useContractRead, useBlockNumber } from "wagmi";
import NounishTokenABI from "../../../abi/nounish-token.json";
import { motion } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";

export default ({ dao, parentFedAddress }) => {
  const { data: currentBlock } = useBlockNumber();
  const [delegatedAmount, setDelegatedAmount] = useState(ethers.BigNumber.from("0"));

  const { refetch } = useContractRead({
    addressOrName: dao.addresses.token,
    contractInterface: NounishTokenABI,
    functionName: "getPriorVotes",
    args: [parentFedAddress, currentBlock - 1],
    enabled: false,
  });

  useEffect(() => {
    const fn = async () => {
      if (currentBlock) {
        const { data } = await refetch();
        setDelegatedAmount(data);
      }
    };

    fn();
  }, [currentBlock]);

  return (
    <li className={styles.item}>
      <Tooltip.Root>
        <Tooltip.Trigger className={styles.trigger}>
          <img src={dao.img} alt={`${dao.name}`} />
        </Tooltip.Trigger>
        <Tooltip.Content
          className={styles.tooltip}
          as={motion.div}
          initial={{ opacity: 0, y: 5, scaleX: 0.5 }}
          animate={{ opacity: 1, y: 0, scaleX: 1 }}
          side="top"
        >
          {`${delegatedAmount?.toNumber()} ${dao.name}`}
          <Tooltip.Arrow offset={10} height={6} width={10} />
        </Tooltip.Content>
      </Tooltip.Root>
    </li>
  );
};
