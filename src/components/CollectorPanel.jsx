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
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Resumen del cobrador
      </Typography>
      <Grid container spacing={3}>
        {[
          { label: "Clientes asignados", value: "—" },
          { label: "Cobros del mes", value: "—" },
          { label: "Impago (estimado)", value: "—" },
        ].map((k) => (
          <Grid key={k.label} item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h5" fontWeight={800}>
                {k.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {k.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="body2" color="text.secondary">
        Próximamente: KPIs de ruta, efectividad de cobro, ranking, etc.
      </Typography>
    </Box>
  );
}

function SectionCobros() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
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

  // 🔎 Debug opcional para confirmar que lee el mismo contexto que la tabla:
  // console.log("[CollectorPanel]", { version, itemsLen: items?.length || 0, total, loading });

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
