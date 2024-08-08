import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { AutoConnect, ConnectEmbed, darkTheme, ThirdwebProvider, useConnectionManager, } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { createContext, useMemo, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createSpyreClient, } from "@/core/client";
import { useClient } from "@/react/hooks/use-client";
export const SpyreClientCtx = createContext(undefined);
// not exported in index.ts
export const wallets = [
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    inAppWallet({
        auth: {
            options: ["email", "google", "apple", "facebook", "phone"],
        },
    }),
];
export function SpyreClientProvider(props) {
    const thirdWebClient = useMemo(() => createThirdwebClient({ clientId: props.config.web3.thirdweb.clientId }), [props.config.web3.thirdweb.clientId]);
    return (_jsxs(ThirdwebProvider, { children: [_jsx(AutoConnect, { wallets: wallets, client: thirdWebClient, appMetadata: props.config.web3.thirdweb.metadata }), _jsx(ThirdwebContextWrapper, { config: props.config, thirdwebClient: thirdWebClient, children: props.children })] }));
}
function ThirdwebContextWrapper(props) {
    const queryClient = useRef(new QueryClient());
    const connectionManager = useConnectionManager();
    const client = useMemo(() => createSpyreClient(props.config, props.thirdwebClient, connectionManager), [props.config]);
    return (_jsx(QueryClientProvider, { client: queryClient.current, children: _jsx(SpyreClientCtx.Provider, { value: client, children: props.children }) }));
}
// not exported in index.ts
export const defaultTheme = darkTheme({
    colors: {
        modalBg: "rgb(23,30,45)",
        borderColor: "rgba(255, 255, 255, 0.5)",
        accentButtonBg: "rgb(41, 27, 146)",
        secondaryText: "rgb(138, 146, 159)",
        accentText: "rgb(255, 255, 255)",
        secondaryIconHoverColor: "rgb(255, 255, 255)",
        secondaryIconHoverBg: "rgba(255, 255, 255, 0.5)",
        secondaryButtonHoverBg: "rgba(255, 255, 255, 0.5)",
    },
});
export function SpyreConnect({ theme }) {
    const client = useClient();
    const thirdwebService = client.web3;
    const thirdweb = thirdwebService.thirdweb;
    return (_jsx(ConnectEmbed, { client: thirdweb, wallets: wallets, theme: theme || defaultTheme, modalSize: "compact", chain: thirdwebService.network, showThirdwebBranding: false, appMetadata: thirdwebService.config.thirdweb.metadata }));
}
