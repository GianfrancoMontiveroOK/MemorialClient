// src/components/ClienteHeader.jsx
import React, { useMemo } from "react";
import {
  Stack,
  Typography,
  Tooltip,
  IconButton,
  Button,
  Chip,
  Skeleton,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import ParkOutlinedIcon from "@mui/icons-material/ParkOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { fmtMoney } from "../ui";

/* helpers */
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const getVigente = (it = {}) => {
  if (isNum(it.cuotaVigente)) return it.cuotaVigente;
  if (it.usarCuotaPisada && isNum(it.cuotaPisada))
    return Number(it.cuotaPisada);
  if (isNum(it.cuotaIdeal)) return Number(it.cuotaIdeal);
  if (isNum(it.cuota)) return Number(it.cuota);
  return null;
};

export default function ClienteHeader({
  item,
  familyCount = 0,
  loading,
  removing,
  onBack,
  onEdit,
  onDelete,
}) {
  const theme = useTheme();
  const title = item?.nombre || "Cliente";

  const pricing = useMemo(() => {
    if (!item) return null;
    const cuota = isNum(item.cuota) ? Number(item.cuota) : null; // histórico cobrado
    const ideal = isNum(item.cuotaIdeal) ? Number(item.cuotaIdeal) : null;
    const vigente = getVigente(item); // respeta pisada si existe
    const desvioAbs = isNum(ideal) && isNum(vigente) ? vigente - ideal : null;
    const desvioPct =
      isNum(ideal) && ideal > 0 && isNum(desvioAbs)
        ? (desvioAbs / ideal) * 100
        : null;
    return { cuota, ideal, vigente, desvioAbs, desvioPct };
  }, [item]);

  const chips = useMemo(() => {
    const arr = [];

    // Estado
    if (item?.activo)
      arr.push(
        <Chip key="activo" size="small" label="Activo" color="success" />
      );
    else arr.push(<Chip key="baja" size="small" label="Baja" />);

    // Flags rápidas (cremación / parcela / emergencia / tarjeta)
    if (item?.cremacion)
      arr.push(
        <Chip
          key="crem"
          size="small"
          variant="outlined"
          color="warning"
          icon={<LocalFireDepartmentOutlinedIcon />}
          label="Cremación"
        />
      );
    if (item?.parcela)
      arr.push(
        <Chip
          key="parcela"
          size="small"
          variant="outlined"
          color="success"
          icon={<ParkOutlinedIcon />}
          label="Parcela"
        />
      );
    if (item?.emergencia)
      arr.push(
        <Chip
          key="emer"
          size="small"
          variant="outlined"
          color="warning"
          icon={<WarningAmberOutlinedIcon />}
          label="Emergencia"
        />
      );
    if (item?.tarjeta)
      arr.push(
        <Chip
          key="tarj"
          size="small"
          variant="outlined"
          color="info"
          icon={<CreditCardOutlinedIcon />}
          label="Tarjeta"
        />
      );

    // Rol
    if (item?.rol)
      arr.push(
        <Chip
          key="rol"
          size="small"
          icon={<BadgeRoundedIcon />}
          label={item.rol}
          variant="outlined"
        />
      );

    // Tipo de factura
    if (item?.tipoFactura && item.tipoFactura !== "none")
      arr.push(
        <Chip
          key="tf"
          size="small"
          icon={<ReceiptLongRoundedIcon />}
          label={`Factura ${item.tipoFactura}`}
          variant="outlined"
        />
      );

    // Grupo familiar
    if (item?.idCliente)
      arr.push(
        <Chip
          key="grupo"
          size="small"
          label={`Grupo #${item.idCliente}${
            familyCount ? ` (${familyCount})` : ""
          }`}
          color="primary"
          variant="outlined"
          icon={<AccountTreeRoundedIcon />}
        />
      );

    // Chip de “Cuota vigente” (respeta pisada) con tooltip comparativo
    if (pricing?.vigente != null) {
      const tips = [
        `Vigente: ${fmtMoney(pricing.vigente)}`,
        pricing.ideal != null ? `Ideal: ${fmtMoney(pricing.ideal)}` : null,
        pricing.cuota != null ? `Histórico: ${fmtMoney(pricing.cuota)}` : null,
        pricing.desvioAbs != null
          ? `Desvío vs ideal: ${fmtMoney(pricing.desvioAbs)}${
              pricing.desvioPct != null
                ? ` (${pricing.desvioPct.toFixed(1)}%)`
                : ""
            }`
          : null,
        item?.usarCuotaPisada && isNum(item?.cuotaPisada)
          ? "Pisada activa"
          : "Según reglas",
      ]
        .filter(Boolean)
        .join(" • ");

      arr.push(
        <Tooltip key="vigente_tip" title={tips} arrow>
          <Chip
            size="small"
            icon={<PaidRoundedIcon />}
            label={fmtMoney(pricing.vigente)}
            sx={{ fontWeight: 700 }}
          />
        </Tooltip>
      );
    }

    return arr;
  }, [item, familyCount, pricing]);

  const copyId = async () => {
    try {
      if (!item?.idCliente) return;
      await navigator.clipboard.writeText(String(item.idCliente));
    } catch {
      // silencioso
    }
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1}
      mb={1.5}
      sx={{
        position: { md: "sticky" },
        top: { md: 12 },
        zIndex: 1,
        py: 0.75,
        px: 0,
        background:
          theme.palette.mode === "dark"
            ? theme.palette.background.default
            : "#fff",
      }}
    >
      {/* Left: título + chips */}
      <Stack direction="row" alignItems="center" spacing={1.25} minWidth={0}>
        <Tooltip title="Volver">
          <IconButton onClick={onBack} size="small" aria-label="Volver">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Typography variant="h5" fontWeight={800} noWrap>
          {loading ? <Skeleton width={220} /> : title}
        </Typography>

        <Stack
          direction="row"
          spacing={0.75}
          flexWrap="wrap"
          useFlexGap
          sx={{ "& .MuiChip-root": { mr: 0.5, mb: 0.5 } }}
        >
          {loading ? (
            <>
              <Skeleton variant="rounded" width={90} height={26} />
              <Skeleton variant="rounded" width={110} height={26} />
              <Skeleton variant="rounded" width={140} height={26} />
            </>
          ) : (
            chips
          )}
        </Stack>
      </Stack>

      {/* Right: acciones */}
      <Stack direction="row" spacing={1}>
        <Tooltip title="Copiar N° Cliente">
          <span>
            <Button
              variant="text"
              size="small"
              startIcon={<ContentCopyRoundedIcon />}
              onClick={copyId}
              disabled={!item?.idCliente}
            >
              #{item?.idCliente ?? "—"}
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Editar">
          <span>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={onEdit}
              disabled={loading || !item}
            >
              Editar
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Eliminar">
          <span>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={onDelete}
              disabled={loading || !item || removing}
            >
              Eliminar
            </Button>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
