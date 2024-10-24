import {ThirdWebWeb3Service} from "@/core/service";
import {useClient} from "@spyre-io/js";

// not exported in index
export const useWeb3Thirdweb = () => {
  const web3 = useClient().web3;

  return (web3 as ThirdWebWeb3Service).thirdweb;
};

export const useWeb3ThirdwebNetwork = () => {
  const web3 = useClient().web3;

  return (web3 as ThirdWebWeb3Service).network;
};

// exported
