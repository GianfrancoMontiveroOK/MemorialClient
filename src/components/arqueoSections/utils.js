import * as React from "react";
import { Chip } from "@mui/material";

export const fmtMoney = (n) =>
  Number(n || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

export const fmtDateTime = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return `${dt.toLocaleDateString("es-AR")} ${dt
    .toLocaleTimeString("es-AR")
    .slice(0, 5)}`;
};

export function sumTotals(items = []) {
  let deb = 0,
    cred = 0;
  for (const it of items) {
    const side = (it.side || it.type || "").toString().toLowerCase();
    const amount = Number(it.amount || 0);
    if (side.startsWith("debit") || side === "ingreso") deb += amount;
    else if (side.startsWith("credit") || side === "egreso") cred += amount;
  }
  return { debits: deb, credits: cred, balance: deb - cred };
}

export function StatusChip({ current, arrearsCount }) {
  if (current === "paid")
    return <Chip size="small" color="success" label="Al día" />;
  return (
    <Chip
      size="small"
      color="warning"
      label={
        Number(arrearsCount) > 0 ? `Atrasado (${arrearsCount})` : "Atrasado"
      }
    />
  );
}
