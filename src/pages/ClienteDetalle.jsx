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
} from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useClients } from "../context/ClientsContext";
import ClienteOverviewSmart from "../components/ClienteOverviewSmart";

export default function ClienteDetalle() {
  const { id } = useParams(); // _id de Mongo
  const navigate = useNavigate();
  const { loadOne, deleteOne, loading, err, setErr, loadFamilyByGroup } =
    useClients();

  const [item, setItem] = useState(null);
  const [family, setFamily] = useState([]);
  const [famLoading, setFamLoading] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Cargar cliente (+familia si está expand o fallback por idCliente)
  useEffect(() => {
    let mounted = true;
    setErr("");
    (async () => {
      try {
        const data = await loadOne(id, { expand: "family" });
        if (!mounted) return;

        // Normaliza doc principal
        const doc = data && data._id ? data : data?.data || data;
        setItem(doc || null);

        // Normaliza familia
        const fromPayload = data?.__family || data?.family;
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
  const addIntegrante = () =>
    navigate(`/app/clientes/nuevo?idCliente=${item?.idCliente ?? ""}`);

  const showSkeleton = loading && !item;

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      <Stack mb={1}>
        <Breadcrumbs aria-label="ruta">
          <MLink
            component={RouterLink}
            underline="hover"
            color="inherit"
            to="/app/clientes"
          >
            Clientes
          </MLink>
          <Typography color="text.primary">{title}</Typography>
        </Breadcrumbs>
      </Stack>

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
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
      ) : (
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
      )}
    </Paper>
  );
}
