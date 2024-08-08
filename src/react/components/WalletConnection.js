import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { defaultTheme, wallets } from "@/react/client-provider";
import { useWeb3Config, useWeb3ConnectionStatus, useWeb3Thirdweb, useWeb3ThirdwebNetwork, } from "@/react/hooks/use-web3";
import { ConnectButton } from "thirdweb/react";
export function WalletConnection({ theme, connected, connecting, disconnected, }) {
    const thirdweb = useWeb3Thirdweb();
    const network = useWeb3ThirdwebNetwork();
    const web3Config = useWeb3Config();
    const config = useMemo(() => ({
        connected: connected ||
            (() => (_jsx(ConnectButton, { client: thirdweb, wallets: wallets, theme: theme || defaultTheme, connectModal: { size: "compact" }, chain: network, appMetadata: web3Config.thirdweb.metadata, detailsButton: {
                    displayBalanceToken: {
                        84532: web3Config.contracts.usdc.addr,
                        8453: web3Config.contracts.usdc.addr,
                    },
                }, supportedTokens: {
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
                } }))),
        connecting: connecting ||
            (() => (_jsx("div", { children: _jsx("p", { children: "Connecting" }) }))),
        disconnected: disconnected ||
            (() => (_jsx("div", { children: _jsx("p", { children: "Disconnected" }) }))),
    }), [connected, connecting, disconnected, thirdweb, network, web3Config]);
    const status = useWeb3ConnectionStatus();
    return config[status]();
}
