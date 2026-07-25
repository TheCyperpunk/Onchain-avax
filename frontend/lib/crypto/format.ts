export const formatCurrency = (value: number | undefined | null, decimals = 2) => {
  if (value === undefined || value === null) return "N/A";
  const absolute = Math.abs(value);
  if (absolute >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (absolute >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (absolute >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: absolute >= 1 ? decimals : 6 }).format(value);
};

export const formatNumber = (value: number | undefined | null) => value === undefined || value === null ? "N/A" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
export const formatPercentage = (value: number | undefined | null) => value === undefined || value === null ? { txt: "N/A", pos: true } : { txt: `${value > 0 ? "+" : ""}${value.toFixed(2)}%`, pos: value >= 0 };
export const formatDate = (value: string | undefined) => !value ? "N/A" : new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
