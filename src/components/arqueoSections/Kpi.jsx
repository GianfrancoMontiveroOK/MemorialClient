import * as React from "react";
import { Paper, Stack, Typography } from "@mui/material";

export default function Kpi({ icon, label, value }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        {icon}
        <Stack>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h6" fontWeight={900} lineHeight={1.2}>
            {value}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
