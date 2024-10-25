"use-client";

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
import {PropsWithChildren, useMemo, useRef} from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {
  useClient,
  CreateSpyreClientOptions,
  SpyreClientCtx,
} from "@spyre-io/js";
import {ThirdWebWeb3Service} from "@/core/service";
import {createThirdwebSpyreClient} from "@/core/client";

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
 * The `ThirdwebSpyreClientProvider` is a React component that provides the Spyre client, context, and hooks to the rest of the application.
 *
 * Wrap your application in this provider to access the Spyre client and its services.
 *
 * ```ts
 * import { ThirdwebSpyreClientProvider } from "@spyre-io/js-thirdweb";
 *
 * function Example() {
 *  return (
 *    <ThirdwebSpyreClientProvider config={config}>
 *      <App />
 *   </ThirdwebSpyreClientProvider>
 *   );
 * }
 * ```
 */
export function ThirdwebSpyreClientProvider(
  props: PropsWithChildren<{
    config: CreateSpyreClientOptions;
  }>,
) {
  const queryClient = useRef(new QueryClient());
  const thirdWebClient = useMemo(
    () =>
      createThirdwebClient({
        clientId: props.config.web3.providerConfig.clientId,
      }),
    [props.config.web3.providerConfig.clientId],
  );

  return (
    <QueryClientProvider client={queryClient.current}>
      <ThirdwebProvider>
        <AutoConnect
          wallets={wallets}
          client={thirdWebClient}
          appMetadata={props.config.web3.providerConfig.metadata}
        />
        <ThirdwebContextWrapper
          config={props.config}
          thirdwebClient={thirdWebClient}
        >
          {props.children}
        </ThirdwebContextWrapper>
      </ThirdwebProvider>
    </QueryClientProvider>
  );
}

function ThirdwebContextWrapper(
  props: PropsWithChildren<{
    config: CreateSpyreClientOptions;
    thirdwebClient: ThirdwebClient;
  }>,
) {
  const connectionManager = useConnectionManager();
  const client = useMemo(
    () =>
      createThirdwebSpyreClient(
        props.config,
        props.thirdwebClient,
        connectionManager,
      ),
    [props.config],
  );

  return (
    <SpyreClientCtx.Provider value={client}>
      {props.children}
    </SpyreClientCtx.Provider>
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
      appMetadata={thirdwebService.config.providerConfig.metadata}
    />
  );
}
