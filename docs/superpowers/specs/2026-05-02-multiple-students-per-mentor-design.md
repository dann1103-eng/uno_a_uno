# Design: Multiple Students per Mentor

**Date:** 2026-05-02
**Status:** Approved

---

## Overview

Currently, each mentor can only have one student assigned (enforced by a `@unique` constraint on `Student.mentorId`). This design lifts that restriction so a supervisor can assign any number of students to a single mentor, without changing the overall data model structure.

---

## Database

### Schema Change

Remove the `@unique` constraint from `Student.mentorId`:

```prisma
// Before
mentorId  String?   @unique

// After
mentorId  String?
```

This converts the User→Student relationship from 1:1 to 1:N. Prisma's relation field on `User` changes from `student Student?` to `students Student[]`.

### Migration

**Before running, verify the index name in Supabase SQL Editor:**
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'students';
```
Expected name: `students_mentorId_key`. Then run:
```sql
DROP INDEX "students_mentorId_key";
```

This is **non-destructive** — no data is deleted or modified. All existing `mentorId` values remain intact.

After applying the SQL, create a migration file at `prisma/migrations/20260502000000_remove_student_mentor_unique/migration.sql` with the same SQL, so `prisma migrate status` stays clean.

After updating `schema.prisma`, run:
```bash
npx prisma generate
```
to regenerate the client at `src/generated/prisma/` with the updated relation.

---

## URL-Based Student Selection

A `?alumno=<studentId>` search parameter controls which student is active across all mentor-facing pages. The pattern:

- If `?alumno` is present and valid → show that student
- If `?alumno` is absent or invalid → default to the first student (ordered by name)
- If the mentor has only 1 student → no tabs shown, same behavior as today

This approach uses pure Server Components (no `useState`), keeps the URL shareable, and requires no new client-side state management.

---

## Affected Files — Complete List

### `prisma/schema.prisma`
- Remove `@unique` from `Student.mentorId`
- Change `User.student Student?` → `User.students Student[]`

### `src/app/(app)/dashboard/page.tsx` — MentorDashboard

**Page-level change:** `DashboardPage` currently has no props. Add `searchParams` prop (Next.js 15 async pattern):
```ts
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ alumno?: string }>;
}) {
  const { alumno } = await searchParams;
  // ...pass alumno down to MentorDashboard
  return <MentorDashboard userId={user.id} userName={...} alumnoId={alumno} />;
}
```

**MentorDashboard changes:**
- Accept `alumnoId?: string` prop
- `findMany` call already exists — add `orderBy: { name: 'asc' }` to it
- Resolve `activeStudent` from the new prop (currently the code does `students[0] ?? null` hardcoded):
  ```ts
  const activeStudent = students.find(s => s.id === alumnoId) ?? students[0] ?? null;
  ```
- All existing queries (`sessionCount`, `lastSession`, `nextTopic`, etc.) already use `student.id` — rename `student` → `activeStudent` so they scope to the correct student
- Render `<StudentTabs students={students} activeId={activeStudent.id} />` above dashboard content when `students.length > 1`

### `src/components/student-tabs.tsx` (new)
Client component rendering tabs for each student:
- Each tab is a `<Link href="?alumno=<id>">` — no onClick needed
- Active tab highlighted with navy background
- Shows student first name on each tab

### `src/app/(app)/mi-estudiante/page.tsx`
- Currently redirects to `/estudiantes/${student.id}`
- Replace `prisma.student.findUnique({ where: { mentorId: user.id } })` with `prisma.student.findFirst({ where: { mentorId: user.id }, orderBy: { name: 'asc' } })`
- **Change redirect target** from `/estudiantes/<id>` → `/dashboard?alumno=<id>`
  - Rationale: with multiple students, the student profile page handles one student at a time. The dashboard is now the multi-student hub; landing there (with the student pre-selected) gives the mentor the full context including the student selector tabs. (requires dashboard `searchParams` support to be done first)

### `src/app/(app)/metas/page.tsx`
- This is a pure redirect page: it resolves a student then redirects to `/estudiantes/<id>?tab=metas`
- Replace `findUnique({ where: { mentorId } })` with `findFirst({ where: { mentorId: user.id }, orderBy: { name: 'asc' } })`
- Redirect target stays `/estudiantes/${student.id}?tab=metas` — no change to destination

### `src/app/(app)/programacion/page.tsx`
- Already uses `findFirst` (no `findUnique` to replace)
- **Page-level change:** Add `searchParams` prop (same async pattern as DashboardPage above)
- For `MENTOR` role: fetch all students (`findMany`), resolve `activeStudent` from `alumno` param (same pattern as MentorDashboard)
- Load completion data for `activeStudent.id` instead of always the first student
- Show `<StudentTabs>` at top when `students.length > 1` on first load

### `src/components/session-form.tsx`
- No logic change needed — the dropdown already shows when `students.length > 1`
- Verified: `useState(students.length === 1 ? students[0].id : "")` auto-selects for single student; multi-student shows a `<Select>` dropdown

### `src/app/(app)/admin/actions.ts`
Three functions need updating:

**`createStudent`:** Remove guard:
```ts
// Remove this block:
if (mentor.student) {
  throw new Error("Este mentor ya tiene un alumno asignado");
}
```
Change `include: { student: true }` → `include: { _count: { select: { students: true } } }`

**`reassignStudent`:** Remove the guard block `if (newMentor.student) { throw ... }` entirely (a mentor can now receive a second student). Update `include: { student: true }` → `include: { _count: { select: { students: true } } }`.

**`deleteUser`:** Replace the entire `if (user.student)` block:
```ts
// Before
if (user.student) {
  await prisma.student.update({ where: { id: user.student.id }, data: { mentorId: null } })
}

// After — removes the student reference without touching students at all
await prisma.student.updateMany({ where: { mentorId: user.id }, data: { mentorId: null } })
```
Change `include: { student: true }` → `include: { students: { select: { id: true } } }`

### `src/app/(app)/admin/page.tsx`
- The `mentorsWithStudents` query currently uses `select: { id: true, name: true, student: { select: { id: true } } }`
- Change to: `select: { id: true, name: true, _count: { select: { students: true } } }`
- Rename variable `mentorsWithStudents` → `mentors` (now returns all mentors regardless of student count)
- In `mentorsForForm` mapping: change `hasStudent: !!m.student` → `studentCount: m._count.students`

### `src/app/(app)/admin/student-list.tsx`
- The `Mentor` type prop uses `hasStudent: boolean`
- Update type to `studentCount: number`
- **Remove the `availableMentors` filter** — now all mentors are shown in the dropdown (multiple students per mentor is the new rule)
- Optionally display `studentCount` next to each mentor's name for context (e.g., "(2 alumnos)")

### `src/app/(app)/admin/create-student-form.tsx`
- Also uses `Mentor` type with `hasStudent: boolean` and `availableMentors = mentors.filter((m) => !m.hasStudent)`
- Update type to `studentCount: number`
- **Remove the filter** — all mentors shown in the dropdown
- Optionally display `studentCount` next to each mentor's name
- Must be updated at the same time as `student-list.tsx` (both receive `Mentor[]` from `admin/page.tsx`)

### `src/app/(app)/mentores/page.tsx`
- Change `include: { student: true }` → `include: { students: { select: { id: true, name: true } } }`
- Update student display: if `students.length === 1` show link as before; if `> 1` show count badge (e.g., "2 alumnos"); if `0` show "Sin estudiante" badge
- Note: the count badge for `> 1` replaces the per-student link for list-view brevity. Per-student links are available on the mentor profile page (`/mentores/[id]`).

### `src/app/(app)/mentores/[id]/page.tsx`
- Change `include: { student: true }` → `include: { students: { select: { id: true, name: true } } }`
- Update "Alumno asignado" section: show list of students (each as a link) instead of one student
- Update label "Alumno asignado:" → "Alumnos asignados:" (plural)
- Stats card "Último tema" — no change needed (scoped to sessions, not students)

### `src/app/(app)/dashboard/page.tsx` — SupervisorDashboard
- In the `prisma.user.findMany` call for mentors: change `include: { student: true }` → `include: { students: { select: { id: true } } }`
- Change `mentorsWithoutStudent` filter: `mentors.filter(m => m.students.length === 0)`
- Note: the `prisma.session.findMany` call also uses `include: { student: true }` — this refers to the Session→Student relation (a session's student), NOT the User→Student relation. Do NOT change this one.

---

## What Does NOT Change

- Session creation flow — already supports multiple students via dropdown
- Student profile page (`/estudiantes/[id]`) — scoped to student, not mentor
- Goals, metrics, evaluations — scoped to student
- Export/PDF (`mentores/[id]`) — scoped to mentor's sessions
- Statistics page — uses `_count.sessions`
- `unassignStudent` in `admin/actions.ts` — operates on `prisma.student.update` by `studentId` directly; not affected by the User→Student relation change

## URL Persistence Scope

The `?alumno=<id>` parameter is page-scoped, not cross-page persistent. Navigating to a different route resets the selection to the default (first student by name). This is intentional for this feature phase.

Sidebar links:
- "Mi Estudiante" → `/mi-estudiante` → redirects to `/dashboard?alumno=<firstStudentId>` (uses first student)
- "Metas" → `/metas` → redirects to `/estudiantes/<firstStudentId>?tab=metas` (uses first student)

There is no mechanism to carry a previously active student selection across routes.

---

## Migration Safety

| Risk | Assessment |
|------|-----------|
| Data loss | None — only drops an index |
| Rollback | Re-add `CREATE UNIQUE INDEX "students_mentorId_key" ON "students"("mentorId") WHERE "mentorId" IS NOT NULL` (would fail if any mentor already has 2+ students) |
| Production users | 10 mentors, each with 1 student — dropping unique has no effect on them |
| TypeScript errors | `User.student` → `User.students` everywhere; `prisma generate` must run before building |
| Migration drift | Must create migration file + mark applied so `prisma migrate status` stays clean |

---

## Implementation Order

1. **Schema** — Remove `@unique` from `Student.mentorId`, rename relation field to `students`
2. **SQL migration** — Verify index name, run `DROP INDEX` in Supabase, create migration file
3. **`prisma generate`** — Regenerate client
4. **Admin actions** — Update `createStudent`, `reassignStudent`, `deleteUser` guards and includes
5. **Admin page + student-list + create-student-form** — Update type, filter, and display in all three files
6. **Mentores list page** — Update include and student display
7. **Mentores profile page** — Update include and student list display
8. **Supervisor dashboard** — Update `mentorsWithoutStudents` filter
9. **Create `StudentTabs` component**
10. **MentorDashboard** — Add `searchParams` to `DashboardPage`, thread `alumno` into `MentorDashboard`, resolve `activeStudent`, scope all queries to active student, mount tabs
11. **`/mi-estudiante`** — `findFirst` + change redirect target to `/dashboard?alumno=<id>`
12. **`/metas`** — `findFirst` only; redirect target stays `/estudiantes/<id>?tab=metas`
13. **`/programacion`** — Add `searchParams` to page, resolve `activeStudent`, add tabs
14. **TypeScript check** (`npx tsc --noEmit`) + commit + push
