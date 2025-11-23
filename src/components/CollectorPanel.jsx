// src/components/CollectorPanel.jsx
import React, { useState } from "react";
import CollectorLayout from "./CollectorLayout";
import CollectorPaymentDrawer from "./CollectorPaymentDrawer";
import { useCollector } from "../context";

// Secciones separadas
import CollectorResumenSection from "./CollectorResumenSection";
import CollectorClientesSection from "./CollectorClientesSection";

export default function CollectorPanel() {
  // "resumen" | "clientes" | "cartera"
  const [section, setSection] = useState("clientes");
  const { createPayment /*, items, total, loading*/ } = useCollector();

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
        return <CollectorResumenSection />;
      case "clientes":
        return <CollectorClientesSection onOpenCobro={openCobro} />;
      default:
        return <CollectorClientesSection onOpenCobro={openCobro} />;
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
