import React from "react";
import {
  Box,
  CircularProgress,
  Divider,
  Alert,
  Button,
  Paper,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useClients } from "../../context/ClientsContext";

import Header from "./sections/Header";
import SummaryPanel from "./sections/SummaryPanel";
import ChartsSection from "./sections/ChartsSection";

export default function ClientesStats() {
  const { stats, loadingStats, fetchStats, err } = useClients();
  const [localErr, setLocalErr] = React.useState("");

  const reload = React.useCallback(async () => {
    setLocalErr("");
    try {
      await fetchStats();
    } catch (e) {
      setLocalErr(
        e?.response?.data?.message ||
          e?.message ||
          "No se pudieron cargar las estadísticas"
      );
    }
  }, [fetchStats]);

  React.useEffect(() => {
    if (!stats && !loadingStats) reload();
  }, [stats, loadingStats, reload]);

  const summary = React.useMemo(
    () =>
      stats?.summary || {
        groups: 0,
        sumCuota: 0,
        sumIdeal: 0,
        sumVigente: 0,
        sumDiff: 0,
        posCount: 0,
        negCount: 0,
        posSum: 0,
        negSum: 0,
        avgCuota: 0,
        avgIntegrantes: 0,
        posPct: 0,
      },
    [stats]
  );

  return (
    <Box>
      <Header loading={loadingStats} onReload={reload} />

      {localErr || err ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {String(localErr || err)}
        </Alert>
      ) : null}

      <SummaryPanel summary={summary} />

      {loadingStats ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="20vh"
        >
          <CircularProgress />
        </Box>
      ) : (
        <ChartsSection stats={stats} />
      )}

      <Divider sx={{ my: 3 }} />

      {/* Debug opcional: ?debugStats=1 */}
      {typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("debugStats") === "1" ? (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px dashed #bbb",
            bgcolor: "#fafafa",
          }}
        >
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
            Debug /clientes/stats (raw)
          </Typography>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1,
              bgcolor: "#0b1020",
              color: "#d6e2ff",
              borderRadius: 1,
              fontSize: 12,
              overflow: "auto",
              maxHeight: 360,
            }}
          >
            {JSON.stringify(stats, null, 2)}
          </Box>
        </Paper>
      ) : null}
    </Box>
  );
}
