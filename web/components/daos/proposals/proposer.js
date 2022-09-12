import Davatar from "@davatar/react";
import { useProvider } from "wagmi";
import useNNSorENS from "../../../hooks/ns/useNNSorENS";

export default ({ addr }) => {
  const p = useProvider();
  const nns = useNNSorENS(addr);

  return (
    <>
      <Davatar size={18} address={addr} provider={p} />
      <span>{nns.address}</span>
    </>
  );
};
