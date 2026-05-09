# Letter Generation — Design Spec
**Date:** 2026-05-09
**Feature:** Cartas de constancia y recomendación para mentores

---

## Overview

The supervisor needs to generate two types of formal letters for volunteer mentors directly from each mentor's profile page (`/mentores/[id]`):

- **Carta de Constancia** — certifies the mentor's participation in the volunteer program
- **Carta de Recomendación** — recommends the mentor based on their performance

Letters are generated as downloadable PDFs. The supervisor can edit the full body text, signer name, and signer title before downloading. Templates always reset to defaults on each modal open (no persistence of edits).

---

## Access Control

- Buttons are **only visible to users with `role === "SUPERVISOR"`**
- Mentors and substitutes never see these buttons
- The modal and PDF components enforce no additional auth (access is gated at render time in the Server Component)

---

## Architecture

### New Files

| File | Responsibility |
|---|---|
| `src/lib/letter-templates.ts` | Default template strings for both letter types. Exports `CONSTANCIA_TEMPLATE` and `RECOMENDACION_TEMPLATE` as functions that accept `mentorName` and return the full body text. |
| `src/components/pdf/carta-pdf.tsx` | React PDF document component. Accepts `title`, `body`, `signerName`, `signerTitle`, `mentorName`, `date`. Renders the formal letter layout using `@react-pdf/renderer`. |
| `src/components/letter-modal.tsx` | Client component. Dialog with editable textarea (body), signer name input, signer title input, and download button. Receives `mentorName`, `supervisorName`, and `type: "constancia" | "recomendacion"` as props. |

### Modified Files

| File | Change |
|---|---|
| `src/app/(app)/mentores/[id]/page.tsx` | Add two `LetterModal` trigger buttons visible only when `user.role === "SUPERVISOR"`. Pass `mentorName` and `user.name` (supervisor) as props. |

### No DB changes required.

---

## Component Design

### `src/lib/letter-templates.ts`

Exports two functions:

```ts
export function getConstanciaTemplate(mentorName: string): string
export function getRecomendacionTemplate(mentorName: string): string
```

Each returns a multi-paragraph string with the mentor's name interpolated. These are the editable defaults shown in the modal textarea.

**Carta de Constancia default body:**

> Por medio de la presente, el suscrito hace constar que **[mentorName]** participa activamente como mentor voluntario en el Programa de Mentoría Uno a Uno, iniciativa dedicada al acompañamiento formativo, académico y personal de estudiantes de nivel primario.
>
> En su rol de mentor, [mentorName] dedica tiempo y esfuerzo de manera voluntaria y desinteresada al desarrollo integral de los jóvenes bajo su cuidado, contribuyendo significativamente a su formación en valores, hábitos de estudio y habilidades de vida.
>
> El Programa de Mentoría Uno a Uno reconoce el compromiso y la labor de [mentorName] como parte fundamental de esta iniciativa de voluntariado, la cual no genera ningún tipo de remuneración económica para los participantes.
>
> Cabe destacar que la participación de [mentorName] implica una dedicación constante a lo largo del ciclo escolar, asistiendo puntualmente a las sesiones programadas y manteniendo una comunicación activa con el equipo coordinador del programa, lo que refleja su seriedad y entrega hacia esta causa.
>
> Se extiende la presente constancia a solicitud del interesado, en Guatemala, el [fecha], para los usos legales y personales que estime conveniente.

**Carta de Recomendación default body:**

> Quien suscribe la presente se permite recomendar amplia y sinceramente a **[mentorName]**, quien se ha desempeñado como mentor voluntario en el Programa de Mentoría Uno a Uno durante el presente ciclo formativo.
>
> A lo largo de su participación, [mentorName] ha demostrado un nivel sobresaliente de compromiso, puntualidad y responsabilidad en el cumplimiento de sus sesiones de mentoría. Su capacidad para establecer vínculos de confianza con los estudiantes y guiarlos en su desarrollo personal y académico lo distingue como un mentor ejemplar.
>
> Asimismo, ha mostrado iniciativa, madurez y vocación de servicio, cualidades que lo hacen destacar entre sus pares y que reflejan el espíritu del programa: acompañar con integridad y dedicación.
>
> Es importante señalar que la influencia positiva de [mentorName] trasciende el aspecto académico, pues su acompañamiento ha contribuido al fortalecimiento del carácter y la autoestima de los estudiantes a su cargo, generando un impacto tangible en su vida cotidiana y en su entorno familiar.
>
> Por todo lo anterior, extiendo la presente recomendación sin reserva alguna, con la plena convicción de que [mentorName] será un aporte valioso en cualquier ámbito en que se desempeñe.

---

### `src/components/pdf/carta-pdf.tsx`

React PDF Document component using `@react-pdf/renderer`. Accepts:

```ts
interface CartaPDFProps {
  title: "CARTA DE CONSTANCIA" | "CARTA DE RECOMENDACIÓN"
  body: string        // editable content from modal
  signerName: string  // editable in modal
  signerTitle: string // editable in modal
  mentorName: string  // read-only, injected from system
  date: string        // read-only, today's date formatted in Spanish
}
```

**Visual layout (classic formal style):**
- White background, A4 size
- Header: centered program name ("PROGRAMA DE MENTORÍA UNO A UNO") with subtitle ("Programa de Voluntariado Formativo"), separated from body by a navy blue bottom border
- Date: right-aligned, formatted as "Guatemala, 9 de mayo de 2026"
- Title: centered, uppercase, navy blue, letter-spaced
- Body: justified text paragraphs with proper spacing
- Signature block: centered, horizontal navy line above signer name, name in bold, title and program name below in gray
- Font: serif (Times-Roman from react-pdf built-ins)

---

### `src/components/letter-modal.tsx`

Client component (`"use client"`). Props:

```ts
interface LetterModalProps {
  mentorName: string
  supervisorName: string
  type: "constancia" | "recomendacion"
}
```

**Internal state (resets on every open via `key` prop or `onOpenChange`):**
- `body: string` — initialized from template function
- `signerName: string` — initialized from `supervisorName`
- `signerTitle: string` — initialized from `"Coordinador del Programa"`

**UI structure:**
- Trigger: a `<Button>` (passed as `children` or rendered by parent)
- `<Dialog>` from shadcn/ui
- Inside dialog:
  - `<DialogHeader>` with title ("Carta de Constancia" or "Carta de Recomendación") and mentor name as subtitle
  - `<Textarea>` for body (full editable content, ~8 rows)
  - Two `<Input>` fields: "Firmante" and "Cargo"
  - `<Button>` "Descargar PDF" — calls `pdf(<CartaPDF .../>).toBlob()`, creates object URL, triggers download
  - Download filename: `carta-constancia-[slug].pdf` or `carta-recomendacion-[slug].pdf` where slug is mentor name lowercased and hyphenated

**Error handling:**
- `try/catch` around PDF generation
- On error: show a simple inline error message inside the dialog

---

### `src/app/(app)/mentores/[id]/page.tsx` changes

After the existing mentor info section, add a conditional block:

```tsx
{user.role === "SUPERVISOR" && (
  <div className="flex gap-3">
    <LetterModal
      mentorName={mentor.name}
      supervisorName={user.name}
      type="constancia"
    />
    <LetterModal
      mentorName={mentor.name}
      supervisorName={user.name}
      type="recomendacion"
    />
  </div>
)}
```

The `LetterModal` component renders its own trigger button internally.

---

## PDF Generation Flow

1. Supervisor opens mentor profile at `/mentores/[id]`
2. Clicks "Carta de Constancia" or "Carta de Recomendación" button
3. Dialog opens with pre-filled textarea (template with mentor name interpolated), signer name (supervisor's name), and signer title ("Coordinador del Programa")
4. Supervisor edits any field freely
5. Clicks "Descargar PDF"
6. `pdf(<CartaPDF .../>).toBlob()` generates the PDF client-side
7. A temporary object URL is created and clicked programmatically to trigger download
8. File downloads as `carta-constancia-eduardo-lima.pdf` (or recomendacion)
9. Modal stays open (supervisor can adjust and re-download if needed)
10. Closing and reopening the modal resets all fields to defaults

---

## Out of Scope

- Saving letter drafts to the database
- Email delivery of letters
- Letter history / audit log
- Logo/image support in the PDF header
- Letter generation from any page other than `/mentores/[id]`
- Access by non-supervisor roles
