import { useBlockNumber } from "wagmi";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import en from "dayjs/locale/en";

dayjs.extend(relativeTime);
const blockTimeInSecs = 12.5;

export default ({ endBlock, execWindow, isExecutable }) => {
  const { data: currentBlock } = useBlockNumber();

  const endDate = dayjs().add(blockTimeInSecs * (endBlock - currentBlock), "seconds");
  const execTime = dayjs().add(blockTimeInSecs * (endBlock - execWindow - currentBlock), "seconds");

  if (isExecutable) {
    return <>Executable {execTime.locale(en).fromNow()}</>;
  }

  return <>Ends {endDate.locale(en).fromNow()}</>;
};
