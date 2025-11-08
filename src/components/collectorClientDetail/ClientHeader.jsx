import React from "react";
import {
  Stack,
  IconButton,
  Typography,
  Chip,
  Tooltip,
  Button,
  Skeleton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupIcon from "@mui/icons-material/Group";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import TuneIcon from "@mui/icons-material/Tune";
import { fmtMoney } from "./utils";

export default function ClientHeader({
  loading,
  client,
  cuotaVig,
  canChargeNow,
  onBack,
  onOpenApply,
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
      <IconButton onClick={onBack}>
        <ArrowBackIcon />
      </IconButton>

      <Typography variant="h5" fontWeight={800} noWrap>
        {loading ? <Skeleton width={260} /> : client?.nombre || "Cliente"}
      </Typography>

      {client?.rol && <Chip size="small" label={client.rol} />}
      {client?.idCliente != null && (
        <Chip
          size="small"
          color="primary"
          variant="outlined"
          icon={<GroupIcon />}
          label={`Grupo #${client.idCliente}`}
        />
      )}

      <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
        <Chip
          color="success"
          variant="outlined"
          icon={<LocalAtmIcon />}
          label={`Cuota vigente: ${fmtMoney(Number(cuotaVig) || 0)}`}
          sx={{ fontWeight: 700 }}
        />
        <Tooltip title="Aplicar pago (Auto/Manual)">
          <span>
            <Button
              size="small"
              variant="contained"
              startIcon={<TuneIcon />}
              onClick={onOpenApply}
              disabled={!client || !canChargeNow}
            >
              Aplicar pago
            </Button>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
