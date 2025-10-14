import React from "react";
import { Paper, Box, Typography } from "@mui/material";

export default function ChartCard({ title, subtitle, children, right }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="subtitle2" fontWeight={800}>
          {title}
        </Typography>
        {right}
      </Box>

      {subtitle ? (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}

      <Box sx={{ flex: 1, minHeight: 240 }}>{children}</Box>
    </Paper>
  );
}
