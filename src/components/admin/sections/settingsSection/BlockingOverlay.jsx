// src/components/admin/sections/settingsSection/BlockingOverlay.jsx
import * as React from "react";
import {
  Backdrop,
  Box,
  CircularProgress,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Stack,
} from "@mui/material";

/**
 * BlockingOverlay
 * - progress: number (0..100) => determinate (subida)
 * - progress: null/undefined => indeterminate (server)
 */
export default function BlockingOverlay({ open, title, subtitle, progress }) {
  return (
    <Backdrop open={!!open} sx={{ zIndex: (t) => t.zIndex.modal + 10 }}>
      <Paper
        elevation={10}
        sx={{
          width: "min(560px, 92vw)",
          p: 3,
          borderRadius: 3,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={900}>
              {title || "Procesando…"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle || "No cierres esta página."}
            </Typography>
          </Box>
        </Stack>

        <Box mt={2}>
          {typeof progress === "number" ? (
            <>
              <LinearProgress
                variant="determinate"
                value={Math.max(0, Math.min(100, progress))}
              />
              <Typography variant="caption" color="text.secondary">
                Subiendo archivos… {Math.max(0, Math.min(100, progress))}%
              </Typography>
            </>
          ) : (
            <>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary">
                Importando en el servidor… (esto puede tardar varios minutos)
              </Typography>
            </>
          )}
        </Box>

        <Alert severity="warning" sx={{ mt: 2 }}>
          No salgas de aquí hasta que termine. Si cerrás la pestaña puede quedar
          el import a medias.
        </Alert>
      </Paper>
    </Backdrop>
  );
}
