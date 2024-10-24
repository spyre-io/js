const weiPer = BigInt("1000000");

export const fromWei = (wad: bigint, decimals: number = 6): bigint => {
  if (!wad) {
    return 0n;
  }

  return wad / 10n ** BigInt(decimals);
};

export const toWei = (wad: bigint): bigint => {
  if (wad === 0n) {
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

export const bigIntToString = (value: bigint): string => {
  return `0x${value.toString(16)}`;
};
