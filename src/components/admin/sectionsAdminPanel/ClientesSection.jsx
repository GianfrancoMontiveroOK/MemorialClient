import React from "react";
import { Box, Typography } from "@mui/material";
import ClientsTableMemorial from "../../ClientsTableMemorial";

export default function ClientesSection({ fetchClients, onView, onEdit, onAssign, onDelete }) {
  return (
    <Box>
      <ClientsTableMemorial
        fetchClients={fetchClients}
        onView={onView}
        onEdit={onEdit}
        onAssign={onAssign}
        onDelete={onDelete}
      />
    </Box>
  );
}
