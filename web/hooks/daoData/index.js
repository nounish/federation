import { useState, useEffect } from "react";
import TestData from "../../data/test/daos/index.json";
import MainnetData from "../../data/mainnet/daos/index.json";

const isDev = process.env.NEXT_PUBLIC_ENV == "dev";
const useDAOIndex = () => {
  return isDev ? TestData : MainnetData;
};

export default useDAOIndex;
