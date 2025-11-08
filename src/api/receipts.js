// src/api/receipts.js
import axios from "./axios";

/**
 * Listar recibos (admin)
 */
export async function listReceipts({
  page = 1,
  pageSize = 25,
  q = "",
  dateFrom = "",
  dateTo = "",
  method = "",
  status = "",
  sortBy = "postedAt",
  sortDir = "desc",
  // ⬇️ default: ver TODOS (aunque no tengan pdfUrl)
  onlyWithPdf = false,
} = {}) {
  const params = {
    page,
    limit: pageSize,
    q,
    dateFrom,
    dateTo,
    method,
    status,
    sortBy,
    sortDir,
    onlyWithPdf,
  };

  const res = await axios.get("/adminReceipts/receipts", {
    params,
    headers: { "Cache-Control": "no-cache" },
    withCredentials: true,
  });

  const data = res?.data || {};
  return {
    ok: data.ok ?? true,
    items: Array.isArray(data.items) ? data.items : [],
    total: Number.isFinite(data.total) ? data.total : 0,
    page: data.page ?? page,
    pageSize: data.pageSize ?? pageSize,
    sortBy: data.sortBy ?? sortBy,
    sortDir: data.sortDir ?? sortDir,
  };
}

/**
 * Devuelve la URL absoluta del endpoint que streamea el PDF.
 * Útil para: "Abrir PDF en nueva pestaña" o compartir por enlace.
 * GET /receipts/:id/pdf
 */
export function getReceiptPdfUrl(id) {
  const rid = String(id || "").trim();
  if (!rid) return "";
  // axios.defaults.baseURL ya está configurado en ./axios
  // Si necesitás la URL ABSOLUTA, axios la arma al usar window.location.origin
  // con baseURL; por compat te devolvemos ruta relativa (axios/baseURL la resuelve).
  return `/receipts/${encodeURIComponent(rid)}/pdf`;
}

/**
 * Descarga el PDF como Blob + su filename (si el server lo envía en Content-Disposition).
 * Ideal para Web Share API con archivos (navigator.share({ files: [...] })).
 */
export async function fetchReceiptPdfBlob(id, { withCredentials = true } = {}) {
  const url = getReceiptPdfUrl(id);
  if (!url) throw new Error("ID de recibo inválido");

  const res = await axios.get(url, {
    responseType: "blob", // importante para PDF binario
    withCredentials,
    headers: {
      Accept: "application/pdf",
      "Cache-Control": "no-cache",
    },
  });

  // Intentar extraer filename del Content-Disposition
  const cd = res?.headers?.["content-disposition"] || "";
  let filename = "recibo.pdf";
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
  if (match) {
    filename = decodeURIComponent(match[1] || match[2] || filename);
  }

  // Asegurar tipo MIME correcto
  const blob = new Blob([res.data], { type: "application/pdf" });
  return { blob, filename, url };
}
