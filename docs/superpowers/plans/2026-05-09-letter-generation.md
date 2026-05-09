# Letter Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Carta de Constancia" and "Carta de Recomendación" PDF generation to each mentor's profile page, accessible only to supervisors.

**Architecture:** Three new files — template functions, a React PDF document component, and a client-side modal — wired into the existing `/mentores/[id]` Server Component. No DB changes. PDF generation runs entirely client-side using `@react-pdf/renderer`, following the exact pattern in `src/components/mentor-export-buttons.tsx`.

**Tech Stack:** Next.js 16 App Router, `@react-pdf/renderer` (already installed), shadcn/ui Dialog/Textarea/Input, TypeScript.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/letter-templates.ts` | Create | Default body text for both letter types |
| `src/components/pdf/carta-pdf.tsx` | Create | React PDF document — formal letter layout |
| `src/components/letter-modal.tsx` | Create | Client modal — edit fields + trigger PDF download |
| `src/app/(app)/mentores/[id]/page.tsx` | Modify | Capture user from `requireRole`, add two `LetterModal` buttons |

---

## Task 1: Letter template functions

**Files:**
- Create: `src/lib/letter-templates.ts`

- [ ] **Step 1: Create the file**

```ts
// src/lib/letter-templates.ts

export function getConstanciaTemplate(mentorName: string): string {
  return `Por medio de la presente, el suscrito hace constar que ${mentorName} participa activamente como mentor voluntario en el Programa de Mentoría Uno a Uno, iniciativa dedicada al acompañamiento formativo, académico y personal de estudiantes de nivel primario.

En su rol de mentor, ${mentorName} dedica tiempo y esfuerzo de manera voluntaria y desinteresada al desarrollo integral de los jóvenes bajo su cuidado, contribuyendo significativamente a su formación en valores, hábitos de estudio y habilidades de vida.

El Programa de Mentoría Uno a Uno reconoce el compromiso y la labor de ${mentorName} como parte fundamental de esta iniciativa de voluntariado, la cual no genera ningún tipo de remuneración económica para los participantes.

Cabe destacar que la participación de ${mentorName} implica una dedicación constante a lo largo del ciclo escolar, asistiendo puntualmente a las sesiones programadas y manteniendo una comunicación activa con el equipo coordinador del programa, lo que refleja su seriedad y entrega hacia esta causa.

Se extiende la presente constancia a solicitud del interesado, en Guatemala, para los usos legales y personales que estime conveniente.`;
}

export function getRecomendacionTemplate(mentorName: string): string {
  return `Quien suscribe la presente se permite recomendar amplia y sinceramente a ${mentorName}, quien se ha desempeñado como mentor voluntario en el Programa de Mentoría Uno a Uno durante el presente ciclo formativo.

A lo largo de su participación, ${mentorName} ha demostrado un nivel sobresaliente de compromiso, puntualidad y responsabilidad en el cumplimiento de sus sesiones de mentoría. Su capacidad para establecer vínculos de confianza con los estudiantes y guiarlos en su desarrollo personal y académico lo distingue como un mentor ejemplar.

Asimismo, ha mostrado iniciativa, madurez y vocación de servicio, cualidades que lo hacen destacar entre sus pares y que reflejan el espíritu del programa: acompañar con integridad y dedicación.

Es importante señalar que la influencia positiva de ${mentorName} trasciende el aspecto académico, pues su acompañamiento ha contribuido al fortalecimiento del carácter y la autoestima de los estudiantes a su cargo, generando un impacto tangible en su vida cotidiana y en su entorno familiar.

Por todo lo anterior, extiendo la presente recomendación sin reserva alguna, con la plena convicción de que ${mentorName} será un aporte valioso en cualquier ámbito en que se desempeñe.`;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors from the new file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/letter-templates.ts
git commit -m "feat: add letter template functions for constancia and recomendacion"
```

---

## Task 2: CartaPDF React PDF document component

**Files:**
- Create: `src/components/pdf/carta-pdf.tsx`

Reference: `src/components/mentor-export-buttons.tsx` — same imports (`Document`, `Page`, `Text`, `View`, `StyleSheet` from `@react-pdf/renderer`), same A4 page setup.

Note: `CartaPDF` does **not** receive a `mentorName` prop. The mentor's name is already embedded in the `body` string by the template functions in Task 1. The component only needs the final rendered strings.

- [ ] **Step 1: Create the file**

```tsx
// src/components/pdf/carta-pdf.tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface CartaPDFProps {
  title: "CARTA DE CONSTANCIA" | "CARTA DE RECOMENDACIÓN";
  body: string;
  signerName: string;
  signerTitle: string;
  date: string; // formatted as "9 de mayo de 2026", rendered as "Guatemala, [date]"
}

const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontFamily: "Times-Roman",
    fontSize: 11,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  header: {
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a5f",
    paddingBottom: 12,
    marginBottom: 16,
  },
  programName: {
    fontSize: 13,
    fontFamily: "Times-Bold",
    color: "#1e3a5f",
    letterSpacing: 1,
    marginBottom: 3,
  },
  programSubtitle: {
    fontSize: 9,
    color: "#64748b",
  },
  date: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "right",
    marginBottom: 12,
  },
  letterTitle: {
    fontSize: 12,
    fontFamily: "Times-Bold",
    color: "#1e3a5f",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.7,
    textAlign: "justify",
    marginBottom: 10,
  },
  signatureBlock: {
    marginTop: 48,
    alignItems: "center",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#1e3a5f",
    width: 200,
    marginBottom: 6,
  },
  signerName: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    textAlign: "center",
  },
  signerTitle: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "center",
    marginTop: 2,
  },
  signerProgram: {
    fontSize: 9,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 1,
  },
});

export function CartaPDF({ title, body, signerName, signerTitle, date }: CartaPDFProps) {
  // Split body into paragraphs for individual <Text> rendering
  const paragraphs = body.split("\n\n").filter((p) => p.trim().length > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.programName}>PROGRAMA DE MENTORÍA UNO A UNO</Text>
          <Text style={styles.programSubtitle}>Programa de Voluntariado Formativo</Text>
        </View>

        {/* Date */}
        <Text style={styles.date}>Guatemala, {date}</Text>

        {/* Letter title */}
        <Text style={styles.letterTitle}>{title}</Text>

        {/* Body paragraphs */}
        {paragraphs.map((paragraph, i) => (
          <Text key={i} style={styles.paragraph}>
            {paragraph.trim()}
          </Text>
        ))}

        {/* Signature */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signerName}>{signerName}</Text>
          <Text style={styles.signerTitle}>{signerTitle}</Text>
          <Text style={styles.signerProgram}>Programa de Mentoría Uno a Uno</Text>
        </View>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pdf/carta-pdf.tsx
git commit -m "feat: add CartaPDF react-pdf document component"
```

---

## Task 3: LetterModal client component

**Files:**
- Create: `src/components/letter-modal.tsx`

Key patterns from `src/components/mentor-export-buttons.tsx`:
- `pdf(<Component />).toBlob()` is async — use `await`
- `URL.createObjectURL(blob)` + anchor `.click()` + `URL.revokeObjectURL(url)` to trigger download
- `useState` for loading state (`loadingPdf`)
- Filename slug: `mentorName.replace(/\s+/g, "-").toLowerCase()`

- [ ] **Step 1: Create the file**

```tsx
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
      setSignerName(supervisorName ?? "Coordinador del Programa");
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
```

- [ ] **Step 2: Check if `Label` component exists**

```bash
ls src/components/ui/label.tsx
```

If it does not exist, replace all `<Label>` usages with `<label className="text-sm font-medium">` and remove the Label import.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/letter-modal.tsx
git commit -m "feat: add LetterModal client component with PDF download"
```

---

## Task 4: Wire into mentor profile page

**Files:**
- Modify: `src/app/(app)/mentores/[id]/page.tsx`

- [ ] **Step 1: Capture user from `requireRole`**

In `src/app/(app)/mentores/[id]/page.tsx`, find:

```ts
await requireRole("SUPERVISOR");
```

Replace with:

```ts
const user = await requireRole("SUPERVISOR");
```

- [ ] **Step 2: Add LetterModal import**

At the top of the file, after the existing imports, add:

```tsx
import { LetterModal } from "@/components/letter-modal";
```

- [ ] **Step 3: Add the two buttons to the page**

The header section is wrapped in `<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">` and closes with `</div>` right after `<MentorExportButtons>` (around line 82). The stats grid starts immediately after.

Insert the new `<div>` **as a sibling after the closing `</div>` of the header flex block**, before the stats grid — so it appears between the header and the stats:

```tsx
      {/* Stats */}
```

becomes:

```tsx
      <div className="flex gap-3 flex-wrap">
        <LetterModal
          mentorName={mentor.name ?? "Mentor"}
          supervisorName={user.name ?? "Coordinador"}
          type="constancia"
        />
        <LetterModal
          mentorName={mentor.name ?? "Mentor"}
          supervisorName={user.name ?? "Coordinador"}
          type="recomendacion"
        />
      </div>

      {/* Stats */}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/mentores/\[id\]/page.tsx
git commit -m "feat: add letter generation buttons to mentor profile page"
```

---

## Task 5: Smoke test + final TypeScript check

**No automated test runner is configured in this project.** Verify manually.

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

- [ ] **Step 3: Manual smoke test — Carta de Constancia**

1. Log in as `roberto@mentores.com` / `super123`
2. Navigate to `/mentores`
3. Click any mentor (e.g. Eduardo Lima)
4. Verify two buttons appear: "Carta de Constancia" and "Carta de Recomendación"
5. Click "Carta de Constancia"
6. Verify modal opens with:
   - Textarea pre-filled with constancia template containing the mentor's name
   - "Firmante" field pre-filled with "Roberto López"
   - "Cargo" field pre-filled with "Coordinador del Programa"
7. Edit the textarea (change a word), then click "Descargar PDF"
8. Verify a PDF downloads named `carta-constancia-eduardo-lima.pdf`
9. Open the PDF — verify formal letter layout: program header, date "Guatemala, [today]", title "CARTA DE CONSTANCIA", body paragraphs, signature block
10. Close and reopen the modal — verify textarea resets to the original template (not your edit)

- [ ] **Step 4: Manual smoke test — Carta de Recomendación**

1. Click "Carta de Recomendación" from the same mentor profile
2. Verify modal opens with recomendacion template
3. Click "Descargar PDF"
4. Verify PDF downloads as `carta-recomendacion-eduardo-lima.pdf` with title "CARTA DE RECOMENDACIÓN"

- [ ] **Step 5: Access control check**

1. Log out and log in as `eduardo.lima@mentores.com` / `mentor123`
2. Navigate to `/mentores/[id]` — verify you are redirected (page is supervisor-only)
3. Confirm mentor cannot access letter generation buttons at all

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: letter generation — carta de constancia y recomendación

Supervisors can generate and download formal PDF letters from each
mentor's profile page. Templates pre-fill with mentor name and reset
on each modal open. Client-side PDF generation via @react-pdf/renderer.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
