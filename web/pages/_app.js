import "../styles/site.scss";
import "@rainbow-me/rainbowkit/styles.css";
import PlausibleProvider from "next-plausible";

import { getDefaultWallets, RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { infuraProvider } from "wagmi/providers/infura";

const validChains = process.env.NEXT_PUBLIC_ENV == "dev" ? [chain.hardhat] : [chain.mainnet];

const { chains, provider } = configureChains(validChains, [
  infuraProvider({ apiKey: process.env.NEXT_PUBLIC_INFURA_API_KEY }),
  jsonRpcProvider({
    rpc: (c) => {
      if (c.id !== chain.hardhat.id) return null;
      return { http: c.rpcUrls.default };
    },
  }),
]);

const { connectors } = getDefaultWallets({
  appName: "federation",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const theme = lightTheme({
  overlayBlur: "small",
  fontStack:
    "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif;",
});

theme.colors.modalBackground = "#fff";
theme.radii.modal = "3px";
theme.radii.modalMobile = "3px";
theme.radii.actionButton = "3px";
theme.radii.menuButton = "3px";
theme.fonts.body = "Helvetica, Arial, sans-serif";

export default ({ Component, pageProps }) => {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains} theme={theme} appInfo={{ appName: "Federation" }}>
        <PlausibleProvider domain="federation.wtf" trackOutboundLinks>
          <Component {...pageProps} />
        </PlausibleProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
};
