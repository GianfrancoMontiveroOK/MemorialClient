// src/components/ui.js
import React from "react";
import { Stack, Typography, Chip } from "@mui/material";

export const fmtDate = (d) => {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("es-AR");
};

export const fmtMoney = (n) =>
  typeof n === "number"
    ? n.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      })
    : "—";

export function LabelValue({ label, value, bold = false }) {
  return (
    <Stack spacing={0.25} minWidth={0}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={bold ? 700 : 500}
        sx={{ wordBreak: "break-word" }}
      >
        {value ?? "—"}
      </Typography>
    </Stack>
  );
}

export function BooleanBadge({ label, value }) {
  const color = value ? "success" : "default";
  return (
    <Chip
      size="small"
      label={label}
      color={color}
      variant={value ? "filled" : "outlined"}
    />
  );
}
