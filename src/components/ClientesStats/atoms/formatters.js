export const moneyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const pctFmt = (n) => `${(Number(n) || 0).toFixed(0)}%`;

export const labelForBucket = (id) => {
  if (id === "otros") return "otros";
  const n = Number(id);
  if (!Number.isFinite(n)) return String(id);
  if (n <= -1e9) return "<= -10M";
  if (n === -10000) return "-10k a -5k";
  if (n === -5000) return "-5k a -1k";
  if (n === -1000) return "-1k a -1";
  if (n === -1) return "-1 a 0";
  if (n === 0) return "0 a 1";
  if (n === 1) return "1 a 1k";
  if (n === 1000) return "1k a 5k";
  if (n === 5000) return "5k a 10k";
  if (n === 10000) return ">= 10k";
  if (n >= 1e9) return ">= 10M";
  return String(n);
};
