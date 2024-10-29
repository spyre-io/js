import {MagicWeb3Service} from "@/core/service";
import {useClient} from "@spyre-io/js";

export const useWeb3Magic = () => {
  const web3 = useClient().web3;

  return (web3 as MagicWeb3Service).magic;
};
