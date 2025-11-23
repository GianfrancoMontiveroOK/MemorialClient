// src/components/ReceiptDialog.jsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  Button,
  Tooltip,
} from "@mui/material";
import ShareRoundedIcon from "@mui/icons-material/IosShare";
import DownloadIcon from "@mui/icons-material/Download";
import LinkIcon from "@mui/icons-material/Link";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { fmtMoney, fmtDate } from "./utils";
import { getReceiptPdfUrl, fetchReceiptPdfBlob } from "../../api/receipts";

function supportsWebShareFiles() {
  // Safari/iOS/Android modernos
  // @ts-ignore
  return !!(
    navigator?.canShare &&
    navigator?.share &&
    navigator.canShare({
      files: [new File([""], "x.pdf", { type: "application/pdf" })],
    })
  );
}

export default function ReceiptDialog({ open, onClose, client, lastReceipt }) {
  const payment = lastReceipt?.pago || lastReceipt?.payment;
  const rx = lastReceipt?.recibo || lastReceipt?.receipt;

  const pdfUrl = rx?._id ? getReceiptPdfUrl(rx._id) : rx?.pdfUrl || "";

  const amount = Number(payment?.amount ?? payment?.importe ?? 0) || 0;

  const paymentDate = fmtDate(
    payment?.postedAt || payment?.createdAt || new Date().toISOString()
  );

  const canDownload = !!rx?._id;
  const canShare = !!rx?._id;
  const canCopyLink = !!pdfUrl;

  const downloadPdf = async () => {
    if (!rx?._id) return;
    try {
      const { blob, filename } = await fetchReceiptPdfBlob(rx._id);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "recibo.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error(e);
      alert("No se pudo descargar el PDF del recibo.");
    }
  };

  const sharePdf = async () => {
    if (!rx?._id) return;
    try {
      const { blob, filename } = await fetchReceiptPdfBlob(rx._id);
      if (supportsWebShareFiles()) {
        const file = new File([blob], filename || "recibo.pdf", {
          type: "application/pdf",
        });
        await navigator.share({
          title: "Recibo de cobro – Memorial",
          text: [
            `Recibo de cobro – Memorial`,
            `Cliente: ${client?.nombre ?? ""}`,
            `Importe: ${fmtMoney(amount)}`,
            `Fecha: ${paymentDate}`,
          ].join("\n"),
          files: [file],
        });
      } else {
        // Fallback: descarga directa
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || "recibo.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
      }
    } catch (e) {
      console.error(e);
      alert("No se pudo compartir el PDF del recibo.");
    }
  };

  const copyLink = async () => {
    if (!pdfUrl) {
      alert("No hay enlace disponible para este recibo.");
      return;
    }
    try {
      await navigator.clipboard.writeText(pdfUrl);
      alert("Enlace copiado al portapapeles.");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = pdfUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      alert("Enlace copiado al portapapeles.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogContent
        sx={{
          pt: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          textAlign: "center",
        }}
      >
        <CheckCircleRoundedIcon sx={{ fontSize: 64, color: "success.main" }} />

        <Typography variant="h6" fontWeight={900}>
          ¡Cobro registrado!
        </Typography>

        <Typography variant="body2" color="text.secondary">
          El recibo PDF está listo para compartir o descargar.
        </Typography>

        {/* Resumen del recibo */}
        {payment && (
          <Stack
            spacing={0.25}
            sx={{
              mt: 1.5,
              mb: 1,
              px: 2,
              py: 1,
              borderRadius: 2,
              bgcolor: "action.hover",
              width: "100%",
            }}
          >
            <Typography
              variant="body2"
              fontWeight={700}
              noWrap
              title={client?.nombre}
            >
              {client?.nombre || "Cliente"}
            </Typography>
            <Typography variant="body2">
              Importe: <strong>{fmtMoney(amount)}</strong>
            </Typography>
            <Typography variant="body2">
              Fecha: <strong>{paymentDate}</strong>
            </Typography>
          </Stack>
        )}

        {/* Botonera */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            mt: 1,
            width: "100%",
            justifyContent: "center",
          }}
        >
          <Tooltip title="Compartir PDF (adjunto)">
            <span>
              <Button
                onClick={sharePdf}
                startIcon={<ShareRoundedIcon />}
                variant="contained"
                color="success"
                fullWidth
                disabled={!canShare}
              >
                Compartir
              </Button>
            </span>
          </Tooltip>

          <Button
            onClick={downloadPdf}
            startIcon={<DownloadIcon />}
            variant="outlined"
            color="inherit"
            fullWidth
            disabled={!canDownload}
          >
            Descargar PDF
          </Button>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button color="inherit" onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
