// src/components/CollectorPanel.jsx
import React, { useState } from "react";
import { Box, Typography, Grid, Paper, Divider } from "@mui/material";
import CollectorLayout from "./CollectorLayout";
import CollectorClientsTable from "./CollectorClientsTable";
import CollectorPaymentDrawer from "./CollectorPaymentDrawer";
// ✅ Import unificado desde el barrel (evita contextos duplicados)
import { useCollector } from "../context";

function SectionResumen() {
  return (
    <Box sx={{ mb: { xs: 3, md: 4 } }}>
      <Typography
        variant="h5"
        fontWeight={700}
        mb={2}
        sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
      >
        Resumen del cobrador
      </Typography>

      <Grid container spacing={2.5}>
        {[
          { label: "Clientes asignados", value: "—" },
          { label: "Cobros del mes", value: "—" },
          { label: "Impago (estimado)", value: "—" },
        ].map((k) => (
          <Grid key={k.label} item xs={12} sm={4}>
            <Paper
              elevation={2}
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="h5"
                fontWeight={800}
                sx={{ fontSize: { xs: "1.4rem", sm: "1.6rem" } }}
              >
                {k.value}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {k.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: { xs: 2.5, md: 3 } }} />
      <Typography variant="body2" color="text.secondary">
        Próximamente: KPIs de ruta, efectividad de cobro, ranking, etc.
      </Typography>
    </Box>
  );
}

function SectionCobros() {
  return (
    <Box sx={{ mb: { xs: 3, md: 4 } }}>
      <Typography
        variant="h5"
        fontWeight={700}
        mb={1.5}
        sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
      >
        Cobros
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Próximamente: listado y filtros de cobros realizados.
      </Typography>
    </Box>
  );
}

export default function CollectorPanel() {
  const [section, setSection] = useState("clientes");
  const { createPayment /*, version, items, total, loading*/ } = useCollector();

  // Drawer de cobro
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [savingPay, setSavingPay] = useState(false);
  const [payError, setPayError] = useState("");

  const openCobro = (client) => {
    setSelected(client);
    setDrawerOpen(true);
  };

  const closeCobro = () => {
    setDrawerOpen(false);
    setSelected(null);
    setPayError("");
  };

  const handleCreatePayment = async (client, payload) => {
    try {
      setSavingPay(true);
      setPayError("");
      await createPayment(client, payload);
      closeCobro();
    } catch (e) {
      setPayError(
        e?.response?.data?.message ||
          e?.message ||
          "No se pudo registrar el cobro"
      );
    } finally {
      setSavingPay(false);
    }
  };

  const renderSection = () => {
    switch (section) {
      case "resumen":
        return <SectionResumen />;
      case "clientes":
        return <CollectorClientsTable onOpenCobro={openCobro} />;
      case "cobros":
        return <SectionCobros />;
      default:
        return <CollectorClientsTable onOpenCobro={openCobro} />;
    }
  };

  return (
    <CollectorLayout
      section={section}
      onChangeSection={setSection}
      title="Cobrador"
    >
      {renderSection()}

      <CollectorPaymentDrawer
        open={drawerOpen}
        onClose={closeCobro}
        client={selected}
        onCreatePayment={handleCreatePayment}
        loading={savingPay}
        error={payError}
      />
    </CollectorLayout>
  );
}
