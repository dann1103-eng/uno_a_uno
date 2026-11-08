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
import {
  getConstanciaTemplate,
  getHorasSocialesTemplate,
  getRecomendacionTemplate,
} from "@/lib/letter-templates";
import { totalHours } from "@/lib/hours";

type LetterType = "constancia" | "recomendacion" | "horas-sociales";

// Firmante por defecto de todas las cartas (el nombre sigue siendo editable en el modal)
const DEFAULT_SIGNER_NAME = "Daniel Mancía";
const DEFAULT_SIGNER_TITLE = "Coordinador del Programa";
// Firma digitalizada del supervisor, servida desde /public
const SIGNATURE_PATH = "/firma-supervisor.png";

interface LetterModalProps {
  mentorName: string;
  type: LetterType;
  /**
   * "supervisor" (por defecto): puede editar el texto, el firmante y la firma.
   * "mentor": autoservicio del tutor; solo completa carrera, universidad y carnet
   * y descarga la constancia de horas sociales con el texto y la firma por defecto.
   */
  variant?: "supervisor" | "mentor";
  /** Solo para "horas-sociales": sesiones registradas del tutor. */
  sessionCount?: number;
  /** Solo para "horas-sociales": fecha de la primera sesión, ya formateada. */
  periodStart?: string;
  /** Solo para "horas-sociales": fecha de la última sesión, ya formateada. */
  periodEnd?: string;
}

const LABELS = {
  constancia: "Carta de Constancia",
  recomendacion: "Carta de Recomendación",
  "horas-sociales": "Constancia de Horas Sociales",
} as const;

const MENTOR_LABEL = "Solicitar constancia de horas sociales";

const PDF_TITLES = {
  constancia: "CARTA DE CONSTANCIA",
  recomendacion: "CARTA DE RECOMENDACIÓN",
  "horas-sociales": "CONSTANCIA DE HORAS SOCIALES",
} as const;

export function LetterModal({
  mentorName,
  type,
  variant = "supervisor",
  sessionCount = 0,
  periodStart = "",
  periodEnd = "",
}: LetterModalProps) {
  const [open, setOpen] = useState(false);
  // null = el texto se genera solo a partir de los campos; string = editado a mano
  const [editedBody, setEditedBody] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [includeSignature, setIncludeSignature] = useState(true);
  const [career, setCareer] = useState("");
  const [university, setUniversity] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMentor = variant === "mentor";
  const label = isMentor ? MENTOR_LABEL : LABELS[type];
  const isSocialHours = type === "horas-sociales";
  const noSessions = isSocialHours && sessionCount === 0;

  const generatedBody =
    type === "constancia"
      ? getConstanciaTemplate(mentorName)
      : type === "recomendacion"
        ? getRecomendacionTemplate(mentorName)
        : getHorasSocialesTemplate({
            mentorName,
            career,
            university,
            studentId,
            sessionCount,
            periodStart,
            periodEnd,
          });
  const body = editedBody ?? generatedBody;

  const missingSocialHoursData =
    isSocialHours && (!career.trim() || !university.trim() || !studentId.trim());

  const sessionsSummary = `${sessionCount} ${sessionCount === 1 ? "sesión" : "sesiones"} · ${totalHours(sessionCount)} horas acumuladas`;

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      // Reset to defaults on open
      setEditedBody(null);
      setSignerName(DEFAULT_SIGNER_NAME);
      setSignerTitle(DEFAULT_SIGNER_TITLE);
      setIncludeSignature(true);
      setCareer("");
      setUniversity("");
      setStudentId("");
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
          signatureSrc={
            includeSignature ? `${window.location.origin}${SIGNATURE_PATH}` : undefined
          }
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("No se pudo generar el PDF. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleOpenChange(true)}
        disabled={noSessions}
        title={
          noSessions
            ? isMentor
              ? "Aún no tienes sesiones registradas"
              : "Este tutor aún no tiene sesiones registradas"
            : undefined
        }
      >
        <FileText className="h-4 w-4 mr-2" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>
              {isMentor
                ? `${sessionsSummary}. Completa tus datos académicos y descarga tu constancia, que incluye la firma del supervisor.`
                : isSocialHours
                  ? `${mentorName} · ${sessionsSummary}`
                  : mentorName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isSocialHours && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="letter-career">Carrera</Label>
                    <Input
                      id="letter-career"
                      value={career}
                      onChange={(e) => setCareer(e.target.value)}
                      placeholder="Ingeniería en Sistemas"
                      maxLength={120}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="letter-university">Universidad</Label>
                    <Input
                      id="letter-university"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      placeholder="Universidad Don Bosco"
                      maxLength={120}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="letter-student-id">Carnet</Label>
                    <Input
                      id="letter-student-id"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="AB123456"
                      maxLength={30}
                    />
                  </div>
                </div>
                {isMentor && (
                  <p className="text-xs text-muted-foreground">
                    Revisa que los datos estén correctos: aparecerán tal cual en la constancia.
                  </p>
                )}
              </>
            )}

            {!isMentor && (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Contenido de la carta</Label>
                    {editedBody !== null && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditedBody(null)}
                      >
                        Restablecer texto
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={body}
                    onChange={(e) => setEditedBody(e.target.value)}
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

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includeSignature}
                    onChange={(e) => setIncludeSignature(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Incluir firma digitalizada
                </label>
              </>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {missingSocialHoursData && (
              <p className="text-xs text-muted-foreground">
                Completa carrera, universidad y carnet para descargar la constancia.
              </p>
            )}

            <Button
              onClick={handleDownload}
              disabled={loading || !body.trim() || missingSocialHoursData}
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
