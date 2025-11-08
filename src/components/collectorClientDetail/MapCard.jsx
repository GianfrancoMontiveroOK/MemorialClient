import React from "react";
import { Paper, Stack, Typography, Button, Box } from "@mui/material";
import MapIcon from "@mui/icons-material/Map";

export default function MapCard({ address, onOpenMaps }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1}
      >
        <Typography variant="subtitle1" fontWeight={800}>
          Mapa (Google)
        </Typography>
        <Button
          size="small"
          startIcon={<MapIcon />}
          onClick={onOpenMaps}
          disabled={!address}
        >
          Ver en Maps
        </Button>
      </Stack>

      <Box
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          aspectRatio: "16/10",
          bgcolor: "background.default",
        }}
      >
        {address ? (
          <iframe
            title="Mapa"
            src={`https://www.google.com/maps?q=${encodeURIComponent(
              address
            )}&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height: "100%" }}
          >
            <Typography variant="body2" color="text.secondary">
              Sin dirección para mostrar.
            </Typography>
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
