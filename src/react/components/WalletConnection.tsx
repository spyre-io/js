import {useMemo} from "react";
import {defaultTheme, wallets} from "../client-provider";
import {
  useWeb3Config,
  useWeb3ConnectionStatus,
  useWeb3Thirdweb,
  useWeb3ThirdwebNetwork,
} from "../hooks/use-web3";
import {ConnectButton, Theme} from "thirdweb/react";

export type WalletConnectionProps = {
  theme?: Theme;
  connected?: () => JSX.Element;
  connecting?: () => JSX.Element;
  disconnected?: () => JSX.Element;
};

export function WalletConnection({
  theme,
  connected,
  connecting,
  disconnected,
}: WalletConnectionProps) {
  const thirdweb = useWeb3Thirdweb();
  const network = useWeb3ThirdwebNetwork();
  const web3Config = useWeb3Config();

  const config = useMemo(
    () => ({
      connected:
        connected ||
        (() => (
          <ConnectButton
            client={thirdweb}
            wallets={wallets}
            theme={theme || defaultTheme}
            connectModal={{size: "compact"}}
            chain={network}
            appMetadata={web3Config.thirdweb.metadata}
            detailsButton={{
              displayBalanceToken: {
                84532: web3Config.contracts.usdc.addr,
                8453: web3Config.contracts.usdc.addr,
              },
            }}
            supportedTokens={{
              84532: [
                {
                  address: web3Config.contracts.usdc.addr,
                  name: "USDC",
                  symbol: "USDC",
                },
              ],
              8453: [
                {
                  address: web3Config.contracts.usdc.addr,
                  name: "USDC",
                  symbol: "USDC",
                },
              ],
            }}
          />
        )),
      connecting:
        connecting ||
        (() => (
          <div>
            <p>Connecting</p>
          </div>
        )),
      disconnected:
        disconnected ||
        (() => (
          <div>
            <p>Disconnected</p>
          </div>
        )),
    }),
    [connected, connecting, disconnected, thirdweb, network, web3Config],
  );

  const status = useWeb3ConnectionStatus();

  return config[status]();
}
