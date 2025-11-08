import React, { useEffect, useMemo, useState } from "react";
import {
  Paper,
  Stack,
  Typography,
  Alert,
  Box,
  Button,
  Tooltip,
  Chip,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useClients } from "../context/ClientsContext";

import Basics from "../components/cliente-form/Basics";
import ProductoYPrecio from "../components/cliente-form/ProductoYPrecio";
import Familiares from "../components/cliente-form/Familiares";
import FechasEstado from "../components/cliente-form/FechasEstado";

export const DOC_TIPOS = ["DNI", "CUIT", "PASAPORTE", "OTRO"];
export const PROVINCIAS = [
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];
export const SEXO_OPTS = ["M", "F", "X"];
export const TIPO_FACTURA = ["A", "B", "C", "none"];

export const ALLOWED = {
  docTipo: new Set(DOC_TIPOS),
  provincia: new Set(PROVINCIAS),
  sexo: new Set(SEXO_OPTS),
  tipoFactura: new Set(TIPO_FACTURA),
};

const emptyValues = {
  idCliente: "",
  nombre: "",
  domicilio: "",
  ciudad: "",
  provincia: "",
  cp: "",
  telefono: "",
  documento: "",
  docTipo: "DNI",
  fechaNac: "",
  edad: "",
  sexo: "X",
  cuil: "",
  cremacion: false,
  parcela: false,
  observaciones: "",
  tipoFactura: "none",
  factura: false,
  emergencia: false,
  tarjeta: false,
  cuota: "",
  cuotaIdeal: "", // readOnly (server)
  idCobrador: "",
  ingreso: "",
  vigencia: "",
  baja: "",
  fechaAumento: "",
  activo: true,
  integrantes: [],
};

const toDateInput = (d) => {
  if (!d) return "";
  const dt =
    d instanceof Date
      ? d
      : typeof d === "number"
      ? new Date(d)
      : new Date(String(d));
  return Number.isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
};
const toNumOr = (v, fb) => (v === "" || v == null ? fb : Number(v));
const calcAge = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return Math.max(a, 0);
};
const toBool = (x) =>
  typeof x === "boolean"
    ? x
    : String(x).toLowerCase() === "true" || Number(x) === 1;

export default function ClienteForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { loadOne, createOne, updateOne, loading, err, setErr, setCurrent } =
    useClients();

  const [values, setValues] = useState(emptyValues);
  const [overrideCuota, setOverrideCuota] = useState(false);
  const [localGroupInfo, setLocalGroupInfo] = useState(null);

  // Meta del grupo (para preview de precio en edición)
  const [serverGroupInfo, setServerGroupInfo] = useState(null);
  // { integrantesCount, cremacionesCount, edadMax }

  useEffect(() => {
    setErr("");
    setCurrent(null);
    setServerGroupInfo(null);

    if (!isEdit) return;

    (async () => {
      try {
        const data = await loadOne(id, { expand: "family" });

        // Set de valores del form
        setValues((v) => ({
          ...v,
          ...data,
          ingreso: toDateInput(data?.ingreso),
          vigencia: toDateInput(data?.vigencia),
          baja: toDateInput(data?.baja),
          fechaAumento: toDateInput(data?.fechaAumento),
          fechaNac: toDateInput(data?.fechaNac),
          cremacion: toBool(data?.cremacion),
          parcela: toBool(data?.parcela),
          factura: toBool(data?.factura),
          emergencia: toBool(data?.emergencia),
          tarjeta: toBool(data?.tarjeta),
          activo: data?.activo !== false,
          cuotaIdeal: data?.cuotaIdeal ?? "",
          integrantes: [], // en edición no se editan acá
        }));

        // Preferí la meta del server; si no llegara, calculo fallback desde 'family'
        const gInfo = data?.__groupInfo || data?.groupInfo || null;

        if (
          gInfo &&
          (Number.isFinite(gInfo.integrantesCount) ||
            Number.isFinite(gInfo.cremacionesCount) ||
            Number.isFinite(gInfo.edadMax))
        ) {
          setServerGroupInfo({
            integrantesCount: Number(gInfo.integrantesCount) || 0,
            cremacionesCount: Number(gInfo.cremacionesCount) || 0,
            edadMax: Number(gInfo.edadMax) || 0,
          });
        } else {
          // Fallback local (solo si el server no lo trajo)
          const family = Array.isArray(data?.family) ? data.family : [];
          const titular = data || {};

          const isValidDate = (v) => {
            if (!v) return false;
            const d = v instanceof Date ? v : new Date(v);
            return !Number.isNaN(d.getTime());
          };
          const isActive = (m) => m?.activo !== false && !isValidDate(m?.baja);
          const ALLOWED = new Set(["TITULAR", "INTEGRANTE"]);

          const miembros = [titular, ...family]
            .filter(Boolean)
            .filter(isActive)
            .filter((m) => ALLOWED.has(m?.rol));

          const integrantesCount = miembros.length;
          const cremacionesCount = miembros.reduce(
            (acc, m) => acc + (m?.cremacion ? 1 : 0),
            0
          );
          const edades = miembros
            .map((m) =>
              Number.isFinite(Number(m?.edad))
                ? Number(m.edad)
                : m?.fechaNac
                ? (() => {
                    const d = new Date(m.fechaNac);
                    if (Number.isNaN(d.getTime())) return undefined;
                    const t = new Date();
                    let a = t.getFullYear() - d.getFullYear();
                    const mm = t.getMonth() - d.getMonth();
                    if (mm < 0 || (mm === 0 && t.getDate() < d.getDate())) a--;
                    return Math.max(a, 0);
                  })()
                : undefined
            )
            .filter((n) => Number.isFinite(n));

          const edadMax = edades.length
            ? Math.max(...edades)
            : Number(data?.edad) || 0;

          setServerGroupInfo({ integrantesCount, cremacionesCount, edadMax });
        }
      } catch (e) {
        console.warn("No se pudo cargar expand=family:", e?.message || e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const handleChange = (field) => (e) => {
    const { type, value: raw, checked } = e.target;
    let value = raw;
    if (type === "checkbox") value = checked;
    else if (type === "number") value = raw === "" ? "" : Number(raw);

    if (ALLOWED[field] && !ALLOWED[field].has(value)) return;
    setValues((v) => ({ ...v, [field]: value }));
  };

  // Integrantes (solo en “nuevo”)
  const pushIntegrante = () =>
    setValues((v) => ({
      ...v,
      integrantes: [
        ...v.integrantes,
        {
          nombre: "",
          documento: "",
          docTipo: "DNI",
          fechaNac: "",
          edad: "",
          sexo: "X",
          cuil: "",
          telefono: "",
          domicilio: "",
          ciudad: "",
          provincia: "",
          cp: "",
          observaciones: "",
          cremacion: false,
          parcela: false,
        },
      ],
    }));

  const updateIntegrante = (idx, field, value) =>
    setValues((v) => {
      const arr = v.integrantes.slice();
      const next = { ...arr[idx], [field]: value };
      if (field === "fechaNac") next.edad = calcAge(value);
      arr[idx] = next;
      return { ...v, integrantes: arr };
    });

  const removeIntegrante = (idx) =>
    setValues((v) => {
      const arr = v.integrantes.slice();
      arr.splice(idx, 1);
      return { ...v, integrantes: arr };
    });

  const canSubmit = useMemo(
    () => String(values.nombre || "").trim() !== "",
    [values.nombre]
  );

  useEffect(() => {
    const edad = calcAge(values.fechaNac);
    setValues((v) => (v.edad === edad ? v : { ...v, edad }));
  }, [values.fechaNac]);

  // Dar de baja UX
  const onToggleBaja = (checked) => {
    if (checked) {
      const ymd = new Date().toISOString().slice(0, 10);
      setValues((v) => ({ ...v, activo: false, baja: ymd }));
    } else {
      setValues((v) => ({ ...v, activo: true, baja: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const clip = (val, set, def) => (set.has(val) ? val : def);
      const n = (v, fb) => (v === "" || v == null ? fb : Number(v));

      // Construimos payload limpio (sin cuotaIdeal y sin integrantes en edit)
      const payload = {
        ...values,
        cuotaIdeal: undefined, // la calcula el server
        idCliente: toNumOr(values.idCliente, undefined),
        idCobrador: toNumOr(values.idCobrador, undefined),
        edad: toNumOr(values.edad, undefined),
        cuota: toNumOr(values.cuota, undefined),
        cremacion: Boolean(values.cremacion),
        parcela: Boolean(values.parcela),
        factura: Boolean(values.factura),
        emergencia: Boolean(values.emergencia),
        tarjeta: Boolean(values.tarjeta),
        activo: Boolean(values.activo),
        docTipo: clip(values.docTipo, ALLOWED.docTipo, "DNI"),
        tipoFactura: clip(
          values.tipoFactura || "none",
          ALLOWED.tipoFactura,
          "none"
        ),
        sexo: clip(values.sexo || "X", ALLOWED.sexo, "X"),
        provincia:
          values.provincia && ALLOWED.provincia.has(values.provincia)
            ? values.provincia
            : "",
        nombre: values.nombre?.toString().trim().toUpperCase(),
        integrantes: isEdit
          ? undefined
          : (values.integrantes || []).map((m) => ({
              ...m,
              edad: n(m.edad, undefined),
              documento: (m.documento || "").toString().trim(),
              nombre: (m.nombre || "").toString().trim().toUpperCase(),
              docTipo: clip(m.docTipo || "DNI", ALLOWED.docTipo, "DNI"),
              sexo: clip(m.sexo || "X", ALLOWED.sexo, "X"),
              provincia:
                m.provincia && ALLOWED.provincia.has(m.provincia)
                  ? m.provincia
                  : "",
              cremacion: Boolean(m.cremacion),
              parcela: Boolean(m.parcela),
            })),
      };

      // Limpieza final
      Object.keys(payload).forEach(
        (k) => payload[k] === undefined && delete payload[k]
      );

      if (isEdit) await updateOne(id, payload);
      else await createOne(payload);

      // 👉 Siempre volver al Dashboard
      navigate("/dashboard");
    } catch (e2) {
      console.error(e2);
    }
  };

  // 👉 contador de grupo (solo “nuevo”)
  const groupCount = values.integrantes.length;
  const groupCremCount =
    values.integrantes.filter((m) => m.cremacion).length +
    (values.cremacion ? 1 : 0);

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1.5}
        sx={{ gap: 1 }}
      >
        <Typography variant="h5" fontWeight={800}>
          {isEdit ? "Editar cliente" : "Nuevo cliente"}
        </Typography>
        <Stack direction="row" spacing={1}>
          {values.activo ? (
            <Chip size="small" label="Activo" color="success" />
          ) : (
            <Chip size="small" label="Inactivo" />
          )}
          {values.emergencia && (
            <Chip size="small" label="Emergencia" color="warning" />
          )}
          {values.tarjeta && <Chip size="small" label="Tarjeta" color="info" />}
        </Stack>
      </Stack>

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 2 }}>
        <b>Precio dinámico:</b> <i>cuotaIdeal</i> se recalcula automáticamente
        en el servidor (Settings → Pricing) al guardar.
      </Alert>

      <Box component="form" onSubmit={handleSubmit}>
        {/* 1) Datos & Documento */}
        <Basics
          isEdit={isEdit}
          values={values}
          onChange={handleChange}
          DOC_TIPOS={DOC_TIPOS}
          PROVINCIAS={PROVINCIAS}
          SEXO_OPTS={SEXO_OPTS}
        />

        {/* 2) Familiares (antes que precios) */}
        {!isEdit && (
          <Familiares
            values={values}
            DOC_TIPOS={DOC_TIPOS}
            PROVINCIAS={PROVINCIAS}
            SEXO_OPTS={SEXO_OPTS}
            pushIntegrante={pushIntegrante}
            updateIntegrante={updateIntegrante}
            removeIntegrante={removeIntegrante}
            onSummaryChange={setLocalGroupInfo} // ⬅️ recibe {integrantesCount, cremacionesCount, edadMax}
          />
        )}

        {/* 3) Precio & Cobranzas */}
        <ProductoYPrecio
          values={values}
          onChange={handleChange}
          overrideCuota={overrideCuota}
          setOverrideCuota={setOverrideCuota}
          TIPO_FACTURA={TIPO_FACTURA}
          // En "editar" usamos el del server; en "nuevo", el local que emite Familiares
          serverGroupInfo={isEdit ? serverGroupInfo : localGroupInfo}
        />

        {/* 4) Fechas & Dar de baja */}
        <FechasEstado
          values={values}
          onChange={handleChange}
          onToggleBaja={onToggleBaja}
        />

        {/* Acciones */}
        <Box
          mt={3}
          sx={{
            position: { xs: "static", md: "sticky" },
            bottom: 0,
            py: 1.5,
            background: (t) => t.palette.background.paper,
            borderTop: (t) => `1px solid ${t.palette.divider}`,
            zIndex: 1,
          }}
        >
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button
              variant="cancel"
              // 👉 Siempre volver al Dashboard
              onClick={() => navigate("/dashboard")}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Tooltip
              title={!canSubmit ? "Completá los campos obligatorios" : ""}
              disableHoverListener={canSubmit}
            >
              <span>
                <Button
                  type="submit"
                  variant="confirm"
                  disabled={loading || !canSubmit}
                >
                  {isEdit ? "Guardar cambios" : "Crear cliente"}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}
