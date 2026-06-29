# Diseño: Catequesis como tipo de tutoría + Horas acumuladas para tutores

**Fecha:** 2026-06-29
**Estado:** Aprobado por el usuario

## Contexto

Gestor de mentores "Uno a Uno" (Fundación ACTÚA). Next.js 16 + Prisma + Supabase Postgres.
En la app, **"Tutor" = rol `MENTOR`**.

Dos features solicitadas:

1. **Catequesis como opción de tutoría.** Hoy `Session.formationTopic` es texto libre y el
   formulario ofrece los 21 temas de formación + "Otro". "CATEQUESIS" solo existe como una
   etiqueta visual en el cronograma (`src/lib/programming-topics.ts`), repetida 7 veces. Se quiere
   que la catequesis sea un tipo de sesión **real y registrable** (que cuente como las demás),
   no solo descriptivo.
2. **Horas acumuladas visibles para el tutor.** Hoy las horas (`nº sesiones × 3h`) solo las ve el
   SUPERVISOR en `mentores/[id]`. El tutor no las ve en su panel.

## Decisiones (confirmadas con el usuario)

- La catequesis se registra **por alumno** y puede ocurrir **varias veces** por alumno.
- La catequesis **mantiene** la evaluación de las 6 virtudes, igual que una sesión de tema.
- El tutor verá sus horas como **tarjeta de total + detalle por sesión**.
- Una catequesis cuenta como una sesión normal: **3 horas**.

## A. Modelo de datos (1 migración nueva)

- Nuevo enum `SessionType { TOPIC, CATEQUESIS }`.
- Campo `kind SessionType @default(TOPIC)` en `Session`. Las sesiones existentes quedan `TOPIC`.
- Se elimina el constraint `unique_student_topic` (`@@unique([studentId, formationTopic])`) para
  permitir varias catequesis. La unicidad de los 21 temas se sigue garantizando **en código**
  (el chequeo ya existe en `createSession`), aplicándolo solo cuando `kind = TOPIC`.

Migración SQL (hand-written, siguiendo el patrón del repo):

```sql
CREATE TYPE "SessionType" AS ENUM ('TOPIC', 'CATEQUESIS');
ALTER TABLE "sessions" ADD COLUMN "kind" "SessionType" NOT NULL DEFAULT 'TOPIC';
ALTER TABLE "sessions" DROP CONSTRAINT "unique_student_topic";
```

**Trade-off:** se pierde el candado a nivel BD contra temas duplicados, pero el único camino de
escritura es `createSession`, que ya valida. Es consistente con la migración previa
`20260502000000_remove_student_mentor_unique`. La alternativa (partial unique index
`WHERE kind='TOPIC'`) se descartó porque Prisma no lo modela en el schema y genera *drift*.

## B. Feature 1 — Catequesis como tipo de tutoría

- **`src/components/session-form.tsx`**: el select "Tema Principal" pasa a ser controlado. Se agrega
  **"Catequesis"** en un grupo separado (junto a "Otro"). Un input oculto `name="kind"` toma el
  valor `CATEQUESIS` cuando se elige Catequesis, si no `TOPIC`. La evaluación de virtudes no cambia.
- **`src/app/(app)/sesiones/actions.ts`**: lee y valida `kind`. El chequeo de duplicado solo corre
  cuando `kind === "TOPIC"` (permite varias catequesis). Guarda `kind` en `session.create`.
  `formationTopic = "Catequesis"`.
- **`src/app/(app)/dashboard/page.tsx`** (progreso): el "Próximo Desafío" y "Tema X / total" se
  calculan con el conteo de sesiones `kind = TOPIC` (no el total), para que las catequesis no
  descuadren la progresión de los 21 temas.
- **Distinción visual**: badge "Catequesis" en el historial del estudiante
  (`estudiantes/[id]`) y en la última sesión del dashboard.

## C. Feature 2 — Horas acumuladas para el tutor

- **`src/app/(app)/dashboard/page.tsx`** (`MentorDashboard`): nueva consulta de todas las sesiones
  del tutor (`mentorId = userId`, de todos sus alumnos):
  - **Tarjeta "Horas acumuladas"** (total = nº sesiones × `HOURS_PER_SESSION`).
  - **Sección "Mis horas"**: tabla con fecha, alumno, tema/tipo, +3h por sesión y total al pie,
    al estilo de `mentores/[id]`.
- Las catequesis cuentan (3h), así que suman a las horas del tutor.

## D. Refactor pequeño

- Centralizar `HOURS_PER_SESSION = 3` en `src/lib/hours.ts` y usarlo en las 3 vistas:
  dashboard del tutor (nuevo), dashboard del supervisor (hoy `* 3` literal) y `mentores/[id]`
  (hoy const local).

## Verificación

El repo no tiene tests ni runner, y no hay `.env` local con `DATABASE_URL`, por lo que no se puede
correr la app contra la base localmente. Verificación:

- `prisma generate` (offline), `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Pasos para el usuario al desplegar: aplicar la migración a Supabase
  (`npx prisma migrate deploy` con `DATABASE_URL`, o ejecutar el SQL en el editor de Supabase) y
  probar el flujo: registrar un tema y una catequesis, confirmar que ambas suman horas, que el
  progreso de temas no se descuadra, y que el tutor ve su tarjeta + detalle de horas.

## Fuera de alcance

- No se modifica el cronograma (`programacion`) ni se numeran las catequesis (se distinguen por
  fecha en el historial).
- Las horas para suplentes/supervisores no se agregan en esta iteración (la feature pide "tutores").
