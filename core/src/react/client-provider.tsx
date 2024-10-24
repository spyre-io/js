import {createWallet, inAppWallet} from "thirdweb/wallets";
import {
  AutoConnect,
  ConnectEmbed,
  darkTheme,
  Theme,
  ThirdwebProvider,
  useConnectionManager,
} from "thirdweb/react";
import {createThirdwebClient, ThirdwebClient} from "thirdweb";
import {createContext, PropsWithChildren, useMemo, useRef} from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {createSpyreClient} from "@/core/client";
import {CreateSpyreClientOptions} from "@/core/types";
import {ISpyreClient} from "@/core/interfaces";
import {useClient} from "@/react/hooks/use-client";
import {ThirdWebWeb3Service} from "@/core/web3/service";

// not exported in index.ts
export const SpyreClientCtx = createContext<ISpyreClient | undefined>(
  undefined,
);

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

/**
 * The `SpyreClientProvider` is a React component that provides the Spyre client, context, and hooks to the rest of the application.
 *
 * Wrap your application in this provider to access the Spyre client and its services.
 *
 * ```ts
 * import { SpyreClientProvider } from "@spyre-io/becky";
 *
 * function Example() {
 *  return (
 *    <SpyreClientProvider config={config}>
 *      <App />
 *   </SpyreClientProvider>
 *   );
 * }
 * ```
 */
export function SpyreClientProvider(
  props: PropsWithChildren<{
    config: CreateSpyreClientOptions;
  }>,
) {
  const thirdWebClient = useMemo(
    () => createThirdwebClient({clientId: props.config.web3.thirdweb.clientId}),
    [props.config.web3.thirdweb.clientId],
  );

  return (
    <ThirdwebProvider>
      <AutoConnect
        wallets={wallets}
        client={thirdWebClient}
        appMetadata={props.config.web3.thirdweb.metadata}
      />
      <ThirdwebContextWrapper
        config={props.config}
        thirdwebClient={thirdWebClient}
      >
        {props.children}
      </ThirdwebContextWrapper>
    </ThirdwebProvider>
  );
}

function ThirdwebContextWrapper(
  props: PropsWithChildren<{
    config: CreateSpyreClientOptions;
    thirdwebClient: ThirdwebClient;
  }>,
) {
  const queryClient = useRef(new QueryClient());
  const connectionManager = useConnectionManager();
  const client = useMemo(
    () =>
      createSpyreClient(props.config, props.thirdwebClient, connectionManager),
    [props.config],
  );

  return (
    <QueryClientProvider client={queryClient.current}>
      <SpyreClientCtx.Provider value={client}>
        {props.children}
      </SpyreClientCtx.Provider>
    </QueryClientProvider>
  );
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

/**
 * The `SpyreConnect` component is a React component that renders the Thirdweb wallet connection modal using the configuration already passed in to the `SpyreClientProvider`.
 */
export function SpyreConnect({theme}: {theme?: Theme}) {
  const client = useClient();
  const thirdwebService = client.web3 as ThirdWebWeb3Service;
  const thirdweb = thirdwebService.thirdweb;

  return (
    <ConnectEmbed
      client={thirdweb}
      wallets={wallets}
      theme={theme || defaultTheme}
      modalSize="compact"
      chain={thirdwebService.network}
      showThirdwebBranding={false}
      appMetadata={thirdwebService.config.thirdweb.metadata}
    />
  );
}
