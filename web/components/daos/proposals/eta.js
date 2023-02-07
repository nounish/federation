import { useBlockNumber } from "wagmi";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import calendar from "dayjs/plugin/calendar";
import en from "dayjs/locale/en";

dayjs.extend(relativeTime);
dayjs.extend(calendar);
const blockTimeInSecs = 12.5;

export const ETA = ({ endBlock, execWindow, isExecutable }) => {
  const { data: currentBlock } = useBlockNumber();

  const endDate = dayjs().add(blockTimeInSecs * (endBlock - currentBlock), "seconds");
  const execTime = dayjs().add(blockTimeInSecs * (endBlock - execWindow - currentBlock), "seconds");

  if (isExecutable) {
    return <>Executable {execTime.locale(en).fromNow()}</>;
  }

  return <>Ends {endDate.locale(en).fromNow()}</>;
};

export const ETATS = ({ endTimestamp, execWindowSecs, isExecutable, currentTimestamp }) => {
  const endDate = dayjs().add(endTimestamp - currentTimestamp, "seconds");
  const execTime = dayjs().add(endTimestamp - currentTimestamp - execWindowSecs, "seconds");

  if (isExecutable) {
    return <>Executable {execTime.locale(en).fromNow()}</>;
  }

  return <>Ends {endDate.locale(en).fromNow()}</>;
};
