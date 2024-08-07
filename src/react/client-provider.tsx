import {createWallet, inAppWallet} from "thirdweb/wallets";
import {
  createSpyreClient,
  CreateSpyreClientOptions,
  ISpyreClient,
} from "../client/client";
import {createContext, PropsWithChildren, useMemo, useRef} from "react";
import {
  AutoConnect,
  ConnectEmbed,
  darkTheme,
  Theme,
  ThirdwebProvider,
  useConnectionManager,
} from "thirdweb/react";
import {createThirdwebClient, ThirdwebClient} from "thirdweb";
import {useClient} from "./hooks/use-client";
import {ThirdWebWeb3Service} from "../core/web3/service";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

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
