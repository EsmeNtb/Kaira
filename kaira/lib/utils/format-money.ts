export function formatMoney(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    },
  ).format(value);
}