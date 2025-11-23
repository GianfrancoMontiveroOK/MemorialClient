import React from "react";
import {
  Stack,
  IconButton,
  Typography,
  Chip,
  Button,
  Skeleton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupIcon from "@mui/icons-material/Group";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import { fmtMoney } from "./utils";

export default function ClientHeader({
  loading,
  client,
  cuotaVig,
  canChargeNow,
  onBack,
  onOpenApply,
}) {
  const hasClient = !!client && !loading;

  return (
    <Stack spacing={1.5} mb={2}>
      {/* Primera fila: back + nombre + chips */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton onClick={onBack} edge="start">
          <ArrowBackIcon />
        </IconButton>

        <Stack spacing={0.5} minWidth={0}>
          {loading ? (
            <Skeleton width={220} />
          ) : (
            <Typography variant="h6" fontWeight={800} noWrap>
              {client?.nombre || "Cliente"}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}
