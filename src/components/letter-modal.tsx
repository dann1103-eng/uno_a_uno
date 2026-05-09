// src/components/letter-modal.tsx
"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { CartaPDF } from "@/components/pdf/carta-pdf";
import { getConstanciaTemplate, getRecomendacionTemplate } from "@/lib/letter-templates";

interface LetterModalProps {
  mentorName: string;
  supervisorName: string;
  type: "constancia" | "recomendacion";
}

const LABELS = {
  constancia: "Carta de Constancia",
  recomendacion: "Carta de Recomendación",
} as const;

const PDF_TITLES = {
  constancia: "CARTA DE CONSTANCIA",
  recomendacion: "CARTA DE RECOMENDACIÓN",
} as const;

function getDefaultBody(type: "constancia" | "recomendacion", mentorName: string): string {
  return type === "constancia"
    ? getConstanciaTemplate(mentorName)
    : getRecomendacionTemplate(mentorName);
}

export function LetterModal({ mentorName, supervisorName, type }: LetterModalProps) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = LABELS[type];

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      // Reset to defaults on open
      setBody(getDefaultBody(type, mentorName));
      setSignerName(supervisorName);
      setSignerTitle("Coordinador del Programa");
      setError(null);
    }
    setOpen(nextOpen);
  }

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const date = new Date().toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const slug = mentorName.replace(/\s+/g, "-").toLowerCase();
      const filename = `carta-${type}-${slug}.pdf`;

      const blob = await pdf(
        <CartaPDF
          title={PDF_TITLES[type]}
          body={body}
          signerName={signerName}
          signerTitle={signerTitle}
          date={date}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("No se pudo generar el PDF. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
        <FileText className="h-4 w-4 mr-2" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>{mentorName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Contenido de la carta</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="resize-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Firmante</Label>
                <Input
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cargo</Label>
                <Input
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              onClick={handleDownload}
              disabled={loading || !body.trim()}
              className="w-full"
            >
              {loading ? "Generando PDF..." : "Descargar PDF"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
