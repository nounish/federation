import { utils, BigNumber } from "ethers";
import { useEffect, useRef, useReducer } from "react";
import { useProvider } from "wagmi";

const useNnsEns = (address) => {
  const p = useProvider();
  const cache = useRef({});

  const shortAddress = [address.substr(0, 4), address.substr(38, 4)].join("...");
  const initialState = {
    loading: false,
    address: "",
  };

  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case "FETCHING":
        return { ...initialState, loading: true };
      case "FETCHED":
        return { ...initialState, loading: false, address: action.address };
      default:
        return state;
    }
  }, initialState);

  const lookupAddress = async (provider, address) => {
    try {
      const res = await provider.call({
        to: "0x5982ce3554b18a5cf02169049e81ec43bfb73961",
        data: "0x55ea6c47000000000000000000000000" + address.substring(2),
      });
      const offset = BigNumber.from(utils.hexDataSlice(res, 0, 32)).toNumber();
      const length = BigNumber.from(utils.hexDataSlice(res, offset, offset + 32)).toNumber();
      const data = utils.hexDataSlice(res, offset + 32, offset + 32 + length);
      return utils.toUtf8String(data) || null;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    let cancelRequest = false;

    const fn = async () => {
      dispatch({ type: "FETCHING" });

      if (cache.current[address]) {
        dispatch({ type: "FETCHED", address: cache.current[address] });
      } else {
        try {
          const name = await lookupAddress(p, address);
          if (name) {
            cache.current[address] = name;
            if (cancelRequest) return;
            dispatch({ type: "FETCHED", address: name });
            return;
          }

          // cache address that doesn't have ens name
          cache.current[address] = shortAddress;
          dispatch({ type: "FETCHED", address: shortAddress });
        } catch (error) {
          if (cancelRequest) return;
          dispatch({ type: "FETCHED", address: shortAddress });
        }
      }
    };

    fn();

    return function cleanup() {
      cancelRequest = true;
    };
  }, [address]);

  return state;
};

export default useNnsEns;
