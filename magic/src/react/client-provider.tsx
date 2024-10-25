import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {PropsWithChildren, useMemo, useRef} from "react";
import {CreateSpyreClientOptions, SpyreClientCtx} from "@spyre-io/js";
import {Magic} from "magic-sdk";
import {AptosExtension} from "@magic-ext/aptos";
import {Extension, InstanceWithExtensions, SDKBase} from "@magic-sdk/provider";
import {createMagicSpyreClient} from "@/core/client";

export function MagicSpyreClientProvider({
  config,
  children,
}: PropsWithChildren<{
  config: CreateSpyreClientOptions;
}>) {
  const queryClient = useRef(new QueryClient());
  const magic = useMemo(() => {
    const magicConfig = config.web3.providerConfig;

    return new Magic(magicConfig.publishableKey, {
      extensions: [
        new AptosExtension({
          nodeUrl: magicConfig.aptos.nodeUrl,
        }),
      ],
    });
  }, [config]);

  return (
    <QueryClientProvider client={queryClient.current}>
      <MagicContextWrapper config={config} magic={magic}>
        {children}
      </MagicContextWrapper>
    </QueryClientProvider>
  );
}

function MagicContextWrapper(
  props: PropsWithChildren<{
    config: CreateSpyreClientOptions;
    magic: InstanceWithExtensions<SDKBase, [AptosExtension, Extension]>;
  }>,
) {
  const client = useMemo(
    () => createMagicSpyreClient(props.config, props.magic),
    [props.config],
  );

  return (
    <SpyreClientCtx.Provider value={client}>
      {props.children}
    </SpyreClientCtx.Provider>
  );
}
