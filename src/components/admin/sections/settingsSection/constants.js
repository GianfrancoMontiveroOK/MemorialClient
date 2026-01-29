// src/components/admin/sections/settingsSection/constants.js

/* ===================== Defaults y helpers ===================== */
export const DEFAULT_RULES = {
  base: 16000,
  cremationCoef: 0.125,
  group: { neutralAt: 4, step: 0.25, minMap: { 1: 0.5, 2: 0.75, 3: 1.0 } },
  age: [
    { min: 66, coef: 1.375 },
    { min: 61, coef: 1.25 },
    { min: 51, coef: 1.125 },
  ],
};

export const toNumber = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

export const normalizeRules = (r) => {
  const clean = {
    base: toNumber(r?.base, DEFAULT_RULES.base),
    cremationCoef: toNumber(r?.cremationCoef, DEFAULT_RULES.cremationCoef),
    group: {
      neutralAt: toNumber(r?.group?.neutralAt, DEFAULT_RULES.group.neutralAt),
      step: toNumber(r?.group?.step, DEFAULT_RULES.group.step),
      minMap: r?.group?.minMap || DEFAULT_RULES.group.minMap,
    },
    age:
      Array.isArray(r?.age) && r.age.length
        ? [...r.age]
        : [...DEFAULT_RULES.age],
  };

  clean.age.sort((a, b) => b.min - a.min);
  clean.age = clean.age.map((t) => ({
    min: toNumber(t.min, 0),
    coef: toNumber(t.coef, 1),
  }));
  return clean;
};

export const stableStr = (obj) => JSON.stringify(obj);

/* =============== Mini engine (preview local) =============== */
export const roundPolicy500 = (x) => {
  if (!Number.isFinite(x)) return 0;
  const mod = x % 500;
  const down = x - mod;
  const up = down + 500;
  return mod >= 250 ? up : down;
};

export const groupFactorWith = (n, group) => {
  const m = Math.max(1, Number(n) || 1);
  const map = group?.minMap || {};
  if (m in map) return toNumber(map[m], 1);
  const neutral = toNumber(group?.neutralAt, 4);
  const step = toNumber(group?.step, 0.25);
  const delta = m - neutral;
  return 1 + delta * step;
};

export const ageCoefWith = (edadMax, tiers) => {
  const e = Number(edadMax) || 0;
  const found = (tiers || []).find((t) => e >= (t?.min ?? 0));
  return found?.coef ? Number(found.coef) : 1;
};

export const computePreview = (
  rules,
  { integrantes, edadMax, cremaciones }
) => {
  const base = toNumber(rules.base, DEFAULT_RULES.base);
  const gf = groupFactorWith(integrantes, rules.group);
  const af = ageCoefWith(edadMax, rules.age);
  const crem = Math.max(0, Number(cremaciones) || 0);
  const cremCost =
    base * toNumber(rules.cremationCoef, DEFAULT_RULES.cremationCoef) * crem;
  const subtotal = base * gf * af + cremCost;
  return roundPolicy500(subtotal);
};

export const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function fmtEta(etaSec) {
  const s = Number(etaSec);
  if (!Number.isFinite(s) || s <= 0) return "—";
  if (s >= 3600)
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  if (s >= 60) return `${Math.floor(s / 60)}m ${Math.floor(s % 60)}s`;
  return `${Math.floor(s)}s`;
}

/* ===================== Import DB constants ===================== */
export const MAX_EXCEL_BYTES = 25 * 1024 * 1024;

// ✅ alias backwards-compatible (para que no rompa tu import actual)
export const MAX_BYTES = MAX_EXCEL_BYTES;

// ✅ solo XLSX (ya que migraste a xlsx)
export const ACCEPT_XLSX =
  ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const ACCEPT_EXCEL = ACCEPT_XLSX;
