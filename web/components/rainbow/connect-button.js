import styles from "./connect-button.module.scss";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AlertTriangle } from "react-feather";
import { useEffect } from "react";

const isDev = process.env.NEXT_PUBLIC_ENV == "dev";

export default () => {
  return (
    <>
      <ConnectButton.Custom>
        {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
          // show chain selection modal if not connected to the right network
          useEffect(() => {
            if (chain.unsupported) {
              setTimeout(() => {
                openChainModal();
              }, 200);
            }
          }, []);
          return (
            <div
              {...(!mounted && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                },
              })}
            >
              {(() => {
                if (!mounted || !account || !chain) {
                  return (
                    <button className={styles.btn} onClick={openConnectModal} type="button">
                      Connect
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button className={styles.btn} onClick={openChainModal} type="button">
                      <AlertTriangle size={16} color="yellow" />
                      {isDev ? "Connect to Hardhat" : "Connect to Mainnet"}
                    </button>
                  );
                }

                return (
                  <button className={styles.btn} onClick={openAccountModal} type="button">
                    {account.displayName}
                  </button>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </>
  );
};
