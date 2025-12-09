// src/pages/ClienteDetalle.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Paper,
  Stack,
  Breadcrumbs,
  Link as MLink,
  Typography,
  Divider,
  Alert,
  Skeleton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import { useClients } from "../context/ClientsContext";
import ClienteOverviewSmart from "../components/ClienteOverviewSmart";
import AdminPaymentsView from "../components/adminPaymentsView"; // index.js se resuelve solo

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import { createAdminOfficePayment } from "../api/adminPayments";

export default function ClienteDetalle() {
  const { id } = useParams(); // _id de Mongo
  const navigate = useNavigate();
  const { loadOne, deleteOne, loading, err, setErr, loadFamilyByGroup } =
    useClients();

  const [item, setItem] = useState(null);
  const [family, setFamily] = useState([]);
  const [famLoading, setFamLoading] = useState(false);
  const [removing, setRemoving] = useState(false);

  // estado de cobro desde oficina
  const [chargeLoading, setChargeLoading] = useState(false);

  // Modal verde de éxito
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  // pestaña activa: "overview" | "adminPayments"
  const [activeTab, setActiveTab] = useState("overview");

  const formatAmount = (v) => {
    if (typeof v !== "number") return "-";
    return v.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    });
  };

  /**
   * Handler que viene desde AdminPaymentsView (botón "Cobrar").
   *
   * AdminPaymentsView:
   *  - abre su propio diálogo (auto/manual),
   *  - arma { strategy, amount, breakdown }
   *  - y nos llama con { clienteId, idCliente, nombre, debt, chargeRule, payload }.
   *
   * Acá sólo llamamos al endpoint createAdminOfficePayment.
   */
  const handleChargeFromOffice = async ({
    clienteId,
    idCliente,
    nombre,
    debt,
    chargeRule,
    payload,
  }) => {
    if (!clienteId) return;

    try {
      setChargeLoading(true);

      const res = await createAdminOfficePayment({
        clienteId,
        idCliente,
        method: "efectivo",
        channel: "backoffice",
        strategy: payload?.strategy || "auto",
        breakdown: payload?.breakdown || [],
        amount: payload?.amount,
      });

      const okStatus = res?.status === 200 || res?.status === 201;

      if (okStatus) {
        setSuccessDialogOpen(true);
        // refrescar cliente para actualizar __debt
        try {
          // ⬅⬅⬅ CAMBIO IMPORTANTE: pedimos también "debt"
          const payloadClient = await loadOne(id, { expand: "family,debt" });
          const doc = payloadClient?.data || payloadClient || null;
          setItem(doc);

          const fromPayload = payloadClient?.__family || payloadClient?.family;
          if (Array.isArray(fromPayload)) {
            const onlyMembers = fromPayload
              .filter(Boolean)
              .filter((m) => String(m?._id) !== String(doc?._id));
            setFamily(onlyMembers);
          }
        } catch {
          // si falla el refresh, seguimos igual
        }
      } else {
        const msg =
          res?.data?.message ||
          "No se pudo registrar el pago en oficina (respuesta inesperada).";
        setErr(msg);
      }
    } catch (e) {
      console.error("Error al registrar pago en oficina:", e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "No se pudo registrar el pago en oficina.";
      setErr(msg);
    } finally {
      setChargeLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccessDialogOpen(false);
  };

  // Cargar cliente (+familia y deuda)
  useEffect(() => {
    let mounted = true;
    setErr("");
    (async () => {
      try {
        // ⬅⬅⬅ ACÁ TAMBIÉN: al cargar por primera vez pedimos "debt"
        const payload = await loadOne(id, { expand: "family,debt" });
        if (!mounted) return;

        const doc = payload?.data || payload || null;
        setItem(doc);

        const fromPayload = payload?.__family || payload?.family;

        if (Array.isArray(fromPayload)) {
          const onlyMembers = fromPayload
            .filter(Boolean)
            .filter((m) => String(m?._id) !== String(doc?._id));
          setFamily(onlyMembers);
        } else if (doc?.idCliente != null) {
          setFamLoading(true);
          const list = await loadFamilyByGroup(doc.idCliente);
          if (!mounted) return;
          const onlyMembers = (Array.isArray(list) ? list : [])
            .filter(Boolean)
            .filter((m) => String(m?._id) !== String(doc?._id));
          setFamily(onlyMembers);
        } else {
          setFamily([]);
        }
      } catch {
        /* el contexto maneja err */
      } finally {
        setFamLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const title = useMemo(() => item?.nombre || "Cliente", [item]);

  // Acciones
  const handleBack = () => navigate(-1);
  const handleEdit = () => navigate(`/app/clientes/${id}/editar`);
  const handleDelete = async () => {
    if (!item) return;
    const label = item.nombre
      ? `${item.nombre} (#${item.idCliente ?? "s/n"})`
      : `#${item.idCliente ?? "s/n"}`;
    if (
      !window.confirm(
        `¿Eliminar cliente ${label}? Esta acción no se puede deshacer.`
      )
    )
      return;

    try {
      setRemoving(true);
      await deleteOne(id);
      navigate("/app/clientes");
    } finally {
      setRemoving(false);
    }
  };

  const goTo = (mongoId) => navigate(`/app/clientes/${mongoId}`);
  const addIntegrante = () => navigate(`/app/clientes/${id}/editar`);

  const showSkeleton = loading && !item;

  // ⬇⬇⬇ Deuda: usamos __debt que debería venir del backend al pedir expand=debt
  const debtSummary = item?.__debt || null;

  const debtPeriods =
    (debtSummary &&
      Array.isArray(debtSummary.periods) &&
      debtSummary.periods) ||
    (Array.isArray(item?.__periods) && item.__periods) ||
    (Array.isArray(item?.periods) && item.periods) ||
    [];

  const adminDebt = debtSummary
    ? { ...debtSummary, periods: debtSummary.periods || debtPeriods }
    : { periods: debtPeriods };

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      {/* Header: breadcrumbs + pestañas */}
      <Stack
        mb={1}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
      >
        <Breadcrumbs aria-label="ruta">
          <MLink
            component={RouterLink}
            underline="hover"
            color="inherit"
            to="/dashboard"
          >
            Clientes
          </MLink>
          <Typography color="text.primary">{title}</Typography>
        </Breadcrumbs>

        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Resumen" value="overview" />
          <Tab label="Pagos oficina" value="adminPayments" />
        </Tabs>
      </Stack>

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      {chargeLoading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Registrando pago en oficina…
        </Alert>
      )}

      <Divider sx={{ mb: 2 }} />

      {showSkeleton ? (
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={68} />
          <Skeleton variant="rounded" height={52} />
          <Skeleton variant="rounded" height={220} />
          <Skeleton variant="rounded" height={220} />
        </Stack>
      ) : activeTab === "overview" ? (
        <ClienteOverviewSmart
          item={item}
          family={family}
          loading={loading || famLoading}
          removing={removing}
          onBack={handleBack}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddIntegrante={addIntegrante}
          onViewMember={goTo}
          onEditMember={(mongoId) =>
            navigate(`/app/clientes/${mongoId}/editar`)
          }
        />
      ) : (
        <AdminPaymentsView
          clienteId={item?._id}
          idCliente={item?.idCliente}
          nombre={item?.nombre}
          debt={adminDebt} // ⬅ esto ya debería venir con periods llenos
          onCharge={handleChargeFromOffice}
        />
      )}

      {/* MODAL VERDE DE ÉXITO */}
      <Dialog
        open={successDialogOpen}
        onClose={handleCloseSuccess}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "success.main",
            color: "success.contrastText",
            textAlign: "center",
            py: 3,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: "center" }}>
          <Stack direction="column" spacing={1} alignItems="center">
            <CheckCircleOutlineIcon sx={{ fontSize: 56 }} />
            <Typography variant="h6" component="span">
              ¡Pago completado!
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{ color: "inherit", textAlign: "center", mt: 1 }}
          >
            El pago en oficina se registró correctamente.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button
            onClick={handleCloseSuccess}
            variant="contained"
            sx={{
              bgcolor: "success.dark",
              "&:hover": { bgcolor: "success.light" },
            }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
