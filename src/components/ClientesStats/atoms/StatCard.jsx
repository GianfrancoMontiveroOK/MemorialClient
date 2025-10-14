import React from "react";
import { Paper, Typography } from "@mui/material";

export default function StatCard({ title, value, hint, color }) {
  return (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: "100%" }}>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h6" fontWeight={800} sx={{ color }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}
