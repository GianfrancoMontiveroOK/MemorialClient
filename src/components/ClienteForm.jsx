// src/pages/ClienteForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Paper,
  Stack,
  Typography,
  Divider,
  Alert,
  Box,
  Button,
  Tooltip,
  Chip,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useClients } from "../context/ClientsContext";
import { calcCuotaPreview } from "../utils/priceRules"; // preview frontend

import Basics from "../components/cliente-form/Basics";
import PlanPrecio from "../components/cliente-form/PlanPrecio";
import Familiares from "../components/cliente-form/Familiares";
import FechasEstado from "../components/cliente-form/FechasEstado";

// ======= Catálogos / enums =======
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
export const TIPO_FACTURA = ["A", "B", "C"];

export const ALLOWED = {
  docTipo: new Set(DOC_TIPOS),
  provincia: new Set(PROVINCIAS),
  sexo: new Set(SEXO_OPTS),
  tipoFactura: new Set(TIPO_FACTURA),
};

// ===== Helpers =====
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
  edad: "",
  edadMaxPoliza: "",
  cremaciones: 0,
  grupoFamiliar: 4,
  idCobrador: "",
  cuota: "",
  plan: "",
  parcela: false,
  observaciones: "",
  emergencia: false,
  tipoFactura: "C",
  factura: false,
  tarjeta: false,
  sexo: "X",
  cuil: "",
  fechaAumento: "",
  fechaNac: "",
  ingreso: "",
  vigencia: "",
  baja: "",
  activo: true,
  // solo para "nuevo"
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
const toNumOr = (v, fb) =>
  v === "" || v === null || v === undefined ? fb : Number(v);
const calcAge = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return Math.max(age, 0);
};

export default function ClienteForm() {
  const { id } = useParams(); // /app/clientes/nuevo | /app/clientes/:id/editar
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { loadOne, createOne, updateOne, loading, err, setErr, setCurrent } =
    useClients();

  const [values, setValues] = useState(emptyValues);
  const [overrideCuota, setOverrideCuota] = useState(false);

  // carga inicial en editar
  useEffect(() => {
    setErr("");
    setCurrent(null);
    if (!isEdit) return;
    (async () => {
      try {
        const data = await loadOne(id);
        setValues((v) => {
          const coerceBool = (x) =>
            typeof x === "boolean" ? x : Boolean(Number(x)) || x === true;
          return {
            ...v,
            ...data,
            grupoFamiliar: data?.grupoFamiliar ?? 4,
            cremaciones: data?.cremaciones ?? 0,
            edadMaxPoliza: data?.edadMaxPoliza ?? data?.edad ?? "",
            ingreso: toDateInput(data?.ingreso),
            vigencia: toDateInput(data?.vigencia),
            baja: toDateInput(data?.baja),
            fechaAumento: toDateInput(data?.fechaAumento),
            fechaNac: toDateInput(data?.fechaNac),
            parcela: coerceBool(data?.parcela),
            factura: coerceBool(data?.factura),
            integrantes: [], // no se gestionan en editar
          };
        });
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  // change handler con enums
  const handleChange = (field) => (e) => {
    const { type, value: raw, checked } = e.target;
    let value = raw;
    if (type === "checkbox") value = checked;
    else if (type === "number") value = raw === "" ? "" : Number(raw);
    if (ALLOWED[field] && !ALLOWED[field].has(value)) return;
    setValues((v) => ({ ...v, [field]: value }));
  };

  // ------- Integrantes (solo en "nuevo") -------
  const pushIntegrante = () =>
    setValues((v) => ({
      ...v,
      integrantes: [
        ...v.integrantes,
        {
          nombre: "",
          documento: "",
          docTipo: "DNI",
          edad: "",
          sexo: "X",
          cuil: "",
          fechaNac: "",
          telefono: "",
          domicilio: "",
          ciudad: "",
          provincia: "",
          cp: "",
          observaciones: "",
        },
      ],
    }));

  const updateIntegrante = (idx, field, value) =>
    setValues((v) => {
      if (ALLOWED[field] && !ALLOWED[field].has(value)) value = undefined;
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

  // ------- Validaciones -------
  const cremVsGrupoError = useMemo(() => {
    const crem = Number(values.cremaciones || 0);
    const grp = Number(values.grupoFamiliar || 0);
    return crem > grp
      ? "Las cremaciones no pueden superar el tamaño del grupo familiar."
      : "";
  }, [values.cremaciones, values.grupoFamiliar]);

  const canSubmit = useMemo(() => {
    const hasNombre = String(values.nombre || "").trim() !== "";
    if (!hasNombre) return false;
    if (cremVsGrupoError) return false;
    return true;
  }, [values.nombre, cremVsGrupoError]);

  // ------- Autocálculos -------
  useEffect(() => {
    const edad = calcAge(values.fechaNac);
    setValues((v) => (v.edad === edad ? v : { ...v, edad }));
  }, [values.fechaNac]);

  useEffect(() => {
    const titular = Number(values.edad || 0) || 0;
    const integrantesAges = (values.integrantes || [])
      .map((m) => Number(m.edad || 0) || 0)
      .filter((n) => n >= 0);
    const maxEdad = Math.max(
      titular,
      ...(integrantesAges.length ? integrantesAges : [0])
    );
    setValues((v) =>
      Number(v.edadMaxPoliza) === maxEdad ? v : { ...v, edadMaxPoliza: maxEdad }
    );
  }, [values.edad, values.integrantes]);

  const cuotaPreview = useMemo(() => {
    const edadMax =
      values.edadMaxPoliza === "" ? 0 : Number(values.edadMaxPoliza);
    const crem = values.cremaciones === "" ? 0 : Number(values.cremaciones);
    return calcCuotaPreview({ edadMax, cremaciones: crem });
  }, [values.edadMaxPoliza, values.cremaciones]);

  useEffect(() => {
    if (!overrideCuota) setValues((v) => ({ ...v, cuota: cuotaPreview }));
  }, [cuotaPreview, overrideCuota]);

  // ------- Submit -------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const clipEnum = (val, set, def) => (set.has(val) ? val : def);
      const normalizeNum = (v, fb) =>
        v === "" || v === null || v === undefined ? fb : Number(v);

      const payload = {
        ...values,
        // numéricos
        idCliente: toNumOr(values.idCliente, undefined),
        idCobrador: toNumOr(values.idCobrador, undefined),
        edad: toNumOr(values.edad, undefined),
        edadMaxPoliza: toNumOr(values.edadMaxPoliza, undefined),
        cremaciones: toNumOr(values.cremaciones, 0),
        grupoFamiliar: toNumOr(values.grupoFamiliar, 4),
        // booleanos
        factura: Boolean(values.factura),
        parcela: Boolean(values.parcela),
        // enums
        docTipo: clipEnum(values.docTipo, ALLOWED.docTipo, "DNI"),
        tipoFactura: clipEnum(values.tipoFactura, ALLOWED.tipoFactura, "C"),
        sexo: clipEnum(values.sexo, ALLOWED.sexo, "X"),
        provincia:
          values.provincia && ALLOWED.provincia.has(values.provincia)
            ? values.provincia
            : "",
        // strings
        nombre: values.nombre?.toString().trim().toUpperCase(),
        // integrantes (solo se envían en nuevo)
        integrantes: (values.integrantes || []).map((m) => ({
          ...m,
          edad: normalizeNum(m.edad, undefined),
          documento: (m.documento || "").toString().trim(),
          nombre: (m.nombre || "").toString().trim().toUpperCase(),
          docTipo: clipEnum(m.docTipo || "DNI", ALLOWED.docTipo, "DNI"),
          sexo: clipEnum(m.sexo || "X", ALLOWED.sexo, "X"),
          provincia:
            m.provincia && ALLOWED.provincia.has(m.provincia)
              ? m.provincia
              : "",
        })),
      };

      if (isEdit) await updateOne(id, payload);
      else await createOne(payload);

      navigate("/app/clientes");
    } catch (e2) {
      console.error(e2);
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      {/* Header simple con chips de estado */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1.5}
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
      {cremVsGrupoError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {cremVsGrupoError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* ===== Basics: Identificación + Contacto + Documento ===== */}
        <Basics
          isEdit={isEdit}
          values={values}
          onChange={handleChange}
          DOC_TIPOS={DOC_TIPOS}
          PROVINCIAS={PROVINCIAS}
          SEXO_OPTS={SEXO_OPTS}
        />

        {/* ===== Plan & Precio ===== */}
        <PlanPrecio
          values={values}
          onChange={handleChange}
          cuotaPreview={cuotaPreview}
          cremVsGrupoError={!!cremVsGrupoError}
          overrideCuota={overrideCuota}
          setOverrideCuota={setOverrideCuota}
          TIPO_FACTURA={TIPO_FACTURA}
        />

        {/* ===== Familiares (solo al crear) ===== */}
        {!isEdit && (
          <Familiares
            values={values}
            DOC_TIPOS={DOC_TIPOS}
            PROVINCIAS={PROVINCIAS}
            SEXO_OPTS={SEXO_OPTS}
            pushIntegrante={pushIntegrante}
            updateIntegrante={updateIntegrante}
            removeIntegrante={removeIntegrante}
            toDateInput={toDateInput}
          />
        )}

        {/* ===== Fechas + Estado & Preferencias + Actions ===== */}
        <FechasEstado values={values} onChange={handleChange} />

        <Box
          mt={3}
          sx={{
            position: { xs: "static", md: "sticky" },
            bottom: 0,
            py: 1.5,
            background: (theme) => theme.palette.background.paper,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            zIndex: 1,
          }}
        >
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button
              variant="cancel"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Tooltip
              title={
                cremVsGrupoError ||
                (!canSubmit ? "Completá los campos obligatorios" : "")
              }
              disableHoverListener={canSubmit && !cremVsGrupoError}
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
