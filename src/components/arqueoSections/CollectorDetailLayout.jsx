import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Tabs,
  Tab,
  Snackbar,
  Alert,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";

export default function CollectorDetailLayout({
  user,
  tab,
  setTab,
  anyLoading,
  onBack,
  onRefresh,
  onArquearCaja,
  toast,
  setToast,
  children,
}) {
  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        mb={1.5}
      >
        <Stack spacing={0.25}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="text"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={onBack}
              disabled={anyLoading}
            >
              Volver
            </Button>
            <Typography variant="h5" fontWeight={900}>
              Detalle del cobrador
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {user?.name || "—"} {user?.email ? `· ${user.email}` : ""}{" "}
            {user?.userId ? `· ID ${user.userId}` : ""}{" "}
            {user?.role ? `· ${user.role}` : ""}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<ContentCutRoundedIcon />}
            variant="outlined"
            color="warning"
            onClick={onArquearCaja}
            disabled={anyLoading}
          >
            Arquear caja
          </Button>
          <Button
            startIcon={<RefreshRoundedIcon />}
            onClick={onRefresh}
            disabled={anyLoading}
          >
            Refrescar
          </Button>
        </Stack>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        textColor="primary"
        indicatorColor="primary"
        sx={{ mb: 1 }}
      >
        <Tab value="caja" label="Caja" />
        <Tab value="pagos" label="Pagos" />
        <Tab
          value="clientes"
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <PeopleAltRoundedIcon fontSize="small" />
              <span>Clientes</span>
            </Stack>
          }
        />
      </Tabs>

      {children}

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.sev}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
