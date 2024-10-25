import {useMemo} from "react";
import {defaultTheme, wallets} from "@/react/client-provider";
import {
  useWeb3Config,
  useWeb3ConnectionStatus,
  Web3Config,
  Web3ConnectionStatus,
} from "@spyre-io/js";
import {
  useWeb3Thirdweb,
  useWeb3ThirdwebNetwork,
} from "@/react/hooks/use-thirdweb";
import {ConnectButton, Theme} from "thirdweb/react";

/**
 * Props for the `WalletConnection` component.
 */
export type WalletConnectionProps = {
  /**
   * The theme to use for the Thirdweb `ConnectButton`.
   */
  theme?: Theme;

  /**
   * A custom component to render when the wallet is connected. If left undefined, it uses Thirdweb's `ConnectButton`.
   */
  connected?: () => JSX.Element;

  /**
   * A custom component to render when the wallet is connecting.
   */
  connecting?: () => JSX.Element;

  /**
   * A custom component to render when the wallet is disconnected.
   */
  disconnected?: () => JSX.Element;
};

/**
 * This React component wraps the Thirdweb `ConnectButton` and provides a simple way to render different components based on the wallet connection status.
 */
export function WalletConnection({
  theme,
  connected,
  connecting,
  disconnected,
}: WalletConnectionProps) {
  const thirdweb = useWeb3Thirdweb();
  const network = useWeb3ThirdwebNetwork();
  const web3Config: Web3Config = useWeb3Config();

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
            appMetadata={web3Config.providerConfig.metadata}
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

  const status = useWeb3ConnectionStatus() as Web3ConnectionStatus;
  return config[status]();
}
