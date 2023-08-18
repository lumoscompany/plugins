export function bn(value: string, decimals: number): string {
  const _value = BigInt(value);
  const _devider = BigInt(Math.pow(10, decimals));

  const l = _value / _devider;
  const r = _value % _devider;

  let result = `${l}`;
  if (r > BigInt(0)) {
    result =
      result +
      "." +
      `${"0".repeat(decimals)}${_value % _devider}`
        .slice(-decimals)
        .replace(/0+$/, "");
  }

  return result;
}
