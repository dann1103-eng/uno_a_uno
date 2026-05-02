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

This converts the User→Student relationship from 1:1 to 1:N. Prisma's relation changes from `User.student Student?` to `User.students Student[]`.

### Migration

The migration runs a single DDL statement:

```sql
DROP INDEX "students_mentorId_key";
```

This is **non-destructive** — no data is deleted or modified. All existing `mentorId` values remain intact.

---

## URL-Based Student Selection

A `?alumno=<studentId>` search parameter controls which student is active across all mentor-facing pages. The pattern:

- If `?alumno` is present and valid → show that student
- If `?alumno` is absent or invalid → default to the first student (by name)
- If the mentor has only 1 student → no tabs shown, same behavior as today

This approach uses pure Server Components (no `useState`), keeps the URL shareable, and requires no new client-side state management.

---

## Affected Pages & Components

### `src/app/(app)/dashboard/page.tsx` — MentorDashboard

- Fetch all students for the mentor: `prisma.student.findMany({ where: { mentorId: userId } })`
- Read `searchParams.alumno` to determine active student
- Render `<StudentTabs>` component above the existing dashboard content when `students.length > 1`
- All existing dashboard content (sessions, progress, next topic, last session) scoped to the active student only

### `src/components/student-tabs.tsx` (new)

Client component rendering tabs for each student:
- Each tab is a `<Link href="?alumno=<id>">` — no `onClick` needed
- Active tab highlighted with navy background
- Shows student first name on each tab

### `src/app/(app)/mi-estudiante/page.tsx`

Replace `prisma.student.findUnique({ where: { mentorId: user.id } })` with `prisma.student.findFirst({ where: { mentorId: user.id }, orderBy: { name: 'asc' } })`. Redirect to `/dashboard?alumno=<id>` instead of directly to the student profile.

### `src/app/(app)/programacion/page.tsx`

- Read `searchParams.alumno` to determine active student for completion tracking
- Show `<StudentTabs>` at the top when `students.length > 1`
- Same completion logic as today, scoped to active student

### `src/components/session-form.tsx`

No logic change needed. The dropdown (`students.length > 1`) already shows when a mentor has multiple students. No change required.

### `src/app/(app)/admin/actions.ts`

- `createStudent`: Remove the guard `if (mentor.student) throw new Error("Este mentor ya tiene un alumno asignado")`
- `reassignStudent`: Same — remove the guard
- Change `include: { student: true }` to `include: { _count: { select: { students: true } } }` where used for validation

### `src/app/(app)/admin/page.tsx`

- Change `hasStudent: !!m.student` to `studentCount: m._count.students` in the mentors form data
- Display student count instead of binary "has student / no student" where relevant

### `src/app/(app)/mentores/page.tsx`

Update the sessions column to use `_count.sessions` (already done). Update the student column to show count if `> 1` (e.g., "2 alumnos") with a link to `/mentores/[id]`.

### `src/app/(app)/mentores/[id]/page.tsx`

Already works — it fetches `sessions` not students for the table. No change needed.

### `src/app/(app)/dashboard/page.tsx` — SupervisorDashboard

- `mentorsWithoutStudent` → `mentorsWithoutStudents`: filter by `m.students.length === 0`
- Widget card shows student count per mentor

---

## What Does NOT Change

- Session creation flow — already supports multiple students via the dropdown
- Student profile page (`/estudiantes/[id]`) — no assumption about 1 student per mentor
- Goals, metrics, evaluations — all scoped to student, not mentor
- Export/PDF — scoped to mentor's sessions, no student count assumption
- Statistics page — uses `_count.sessions`, unaffected

---

## Migration Safety

| Risk | Assessment |
|------|-----------|
| Data loss | None — only drops an index |
| Rollback | Re-add `@unique` if needed (would fail if any mentor already has 2+ students) |
| Production users | 10 mentors, each with 1 student — dropping unique constraint has no effect on them |
| Breaking existing queries | `User.student` (singular) must be renamed to `User.students` everywhere |

---

## Implementation Order

1. Schema + migration (SQL in Supabase)
2. Update all Prisma queries using `User.student` → `User.students`
3. Create `StudentTabs` component
4. Update `MentorDashboard` with `searchParams` and tabs
5. Update `/mi-estudiante` redirect
6. Update `/programacion` with selector
7. Update admin actions (remove guards)
8. Update admin page display
9. TypeScript check + commit
