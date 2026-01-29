import React from "react";
import {
  Paper,
  Stack,
  Typography,
  Tooltip,
  IconButton,
  Button,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";

export default function FilePickCard({
  title,
  file,
  disabled,
  onPick,
  onClear,
  accept,
  helper = "No seleccionado",
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="subtitle2">{title}</Typography>
        {file ? (
          <Tooltip title="Quitar">
            <span>
              <IconButton size="small" onClick={onClear} disabled={disabled}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        ) : null}
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 1 }}
      >
        {file ? file.name : helper}
      </Typography>

      <Button
        fullWidth
        variant="outlined"
        component="label"
        startIcon={<UploadFileIcon />}
        disabled={disabled}
      >
        Elegir archivo
        <input type="file" hidden accept={accept} onChange={onPick} />
      </Button>
    </Paper>
  );
}
