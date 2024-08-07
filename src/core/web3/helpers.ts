import {Signature} from "./types";

type DomainOptions = {
  contractAddr: `0x${string}`;
  chainId: number;
  name?: string;
  version?: string;
};

const weiPer = BigInt("1000000");

export const getStakingDomain = ({
  contractAddr,
  chainId,
  version = "1",
  name = "gamestaking",
}: DomainOptions) => {
  return {
    name,
    version,
    chainId,
    verifyingContract: contractAddr,
  };
};

export const getStakingTypes = () => [
  {
    name: "user",
    type: "address",
  },
  {
    name: "nonce",
    type: "uint256",
  },
  {
    name: "expiry",
    type: "uint256",
  },
  {
    name: "amount",
    type: "uint256",
  },
  {
    name: "fee",
    type: "uint256",
  },
];

export const getPermitDomain = ({contractAddr, chainId}: DomainOptions) => {
  return {
    name: 8453 === chainId ? "USD Coin" : "USDC",
    version: "2",
    chainId,
    verifyingContract: contractAddr,
  };
};

export const getPermitTypes = () => {
  return [
    {
      name: "owner",
      type: "address",
    },
    {
      name: "spender",
      type: "address",
    },
    {
      name: "value",
      type: "uint256",
    },
    {
      name: "nonce",
      type: "uint256",
    },
    {
      name: "deadline",
      type: "uint256",
    },
  ];
};

export const getDepositDomain = getStakingDomain;

export const getDepositTypes = () => {
  return [
    {
      name: "user",
      type: "address",
    },
    {
      name: "nonce",
      type: "uint256",
    },
    {
      name: "expiry",
      type: "uint256",
    },
    {
      name: "amount",
      type: "uint256",
    },
    {
      name: "fee",
      type: "uint256",
    },
  ];
};

export const getRSV = (signature: string): Signature => ({
  r: "0x" + signature.substring(2, 66),
  s: "0x" + signature.substring(66, 130),
  v: "0x" + signature.substring(130, 132),
});

export const fromWei = (wad: BigInt, decimals = 6): number => {
  return Number(wad.toString()) / 10 ** decimals;
};

export const toWei = (wad: number): BigInt => {
  if (wad === 0) {
    return BigInt(0);
  }

  // get the decimal out
  const str = wad.toString();
  const decimalIndex = str.indexOf(".");
  if (decimalIndex === -1) {
    return BigInt(wad) * weiPer;
  }

  const tens = Math.max(0, 6 - (str.length - 1 - decimalIndex));
  const val = str.replace(".", "");
  const weiMultiplier = BigInt(10) ** BigInt(tens);

  return BigInt(val) * weiMultiplier;
};
