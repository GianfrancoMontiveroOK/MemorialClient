export const fmtMoney = (n) =>
  typeof n === "number"
    ? n.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      })
    : "—";

export const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("es-AR");
};

export const digits = (s = "") => String(s).replace(/\D+/g, "");
export const buildAddress = (r) =>
  [r?.domicilio, r?.ciudad, r?.provincia, r?.cp].filter(Boolean).join(", ");
