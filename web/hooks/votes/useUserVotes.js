import { ethers, BigNumber } from "ethers";
import { useEffect, useState } from "react";
import { useProvider } from "wagmi";
import NounishTokenABI from "../../abi/nounish-token.json";

// useUserVotes calculates how much representation an address
// has for both regular and multiToken delegates
const useUserVotes = (dao) => (address, fromBlock) => {
  const p = useProvider();
  const [votes, setVotes] = useState(BigNumber.from("0"));
  const [err, setErr] = useState(null);

  useEffect(() => {
    const fn = async () => {
      // if we are using the multiToken delegate we should
      // aggregate votes from all tokens and mul by weight
      if (dao.multiToken) {
        let agg = 0;
        for (let i = 0; i < dao.multiToken.tokens.length; i++) {
          const token = new ethers.Contract(dao.multiToken.tokens[i], NounishTokenABI, p);
          const weight = dao.multiToken.weights[i];
          const fallback = dao.multiToken.fallback[i];
          try {
            if (fallback) {
              const rep = await token.balanceOf(address);
              agg += rep * weight;
              continue;
            }

            const rep = await token.getPriorVotes(address, fromBlock);
            agg += rep * weight;
          } catch (ex) {
            console.error("[useUserVotes multitoken]", ex);
            setErr(ex);
            return;
          }
        }

        setVotes(BigNumber.from(agg));
        return;
      }

      // calculate standard vote rep
      const token = new ethers.Contract(dao.addresses.token, NounishTokenABI, p);
      try {
        const rep = await token.getPriorVotes(address, fromBlock);
        setVotes(BigNumber.from(rep));
      } catch (ex) {
        console.error("[useUserVotes]", ex);
        setErr(ex);
      }
    };

    if (!dao) return;

    fn();
  }, []);

  return { votes, err };
};

export default useUserVotes;
