// src/utils/priceRules.js

// Base para grupo familiar 4, sin cremación, edad máx < 50
export const BASE_PRICE = 16000;

/**
 * Devuelve el factor de edad según la edad máxima de la póliza.
 * >65 → 1.375, >60 → 1.25, >50 → 1.125, si no → 1
 * @param {number} edadMax
 * @returns {number}
 */
export function getAgeFactor(edadMax = 0) {
  const n = Number(edadMax) || 0;
  if (n > 65) return 1.375;
  if (n > 60) return 1.25;
  if (n > 50) return 1.125;
  return 1;
}

/**
 * Calcula la cuota estimada para mostrar como preview en el frontend.
 * El backend recalcula como fuente de verdad.
 * Fórmula:
 *   total = BASE * factorEdad + (BASE * 0.125 * cremaciones)
 *
 * @param {Object} opts
 * @param {number} opts.edadMax        - Edad máxima de la póliza
 * @param {number} opts.cremaciones    - Cantidad de integrantes con cremación
 * @param {number} [opts.base=BASE_PRICE] - Base parametrizable
 * @returns {number} total redondeado (entero)
 */
export function calcCuotaPreview({
  edadMax = 0,
  cremaciones = 0,
  base = BASE_PRICE,
} = {}) {
  const factor = getAgeFactor(edadMax);
  const addCrem = base * 0.125 * (Number(cremaciones) || 0);
  const total = base * factor + addCrem;
  return Math.round(total);
}
