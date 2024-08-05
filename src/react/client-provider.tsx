import {createWallet, inAppWallet} from "thirdweb/wallets";
import {
  createSpyreClient,
  CreateSpyreClientOptions,
  ISpyreClient,
} from "../client/client";
import {createContext, PropsWithChildren, useMemo} from "react";
import {
  AutoConnect,
  ThirdwebProvider,
  useConnectionManager,
} from "thirdweb/react";
import {createThirdwebClient, ThirdwebClient} from "thirdweb";

export const SpyreClientCtx = createContext<ISpyreClient | undefined>(
  undefined,
);

const wallets = [
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
  const connectionManager = useConnectionManager();
  const client = useMemo(
    () =>
      createSpyreClient(props.config, props.thirdwebClient, connectionManager),
    [props.config],
  );

  return (
    <SpyreClientCtx.Provider value={client}>
      {props.children}
    </SpyreClientCtx.Provider>
  );
}
