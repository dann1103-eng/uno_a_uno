# Multiple Students per Mentor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lift the 1:1 mentor-student constraint so a supervisor can assign any number of students to a single mentor, with URL-based (`?alumno=<id>`) student switching in the mentor dashboard and programación page.

**Architecture:** Remove `@unique` from `Student.mentorId` in Prisma (converting User→Student from 1:1 to 1:N), apply the SQL migration in Supabase, then update every file that references the old singular `User.student` relation. Mentor-facing pages use Next.js `searchParams` (no client state) to resolve which student is active.

**Tech Stack:** Next.js 16 App Router, Prisma 7.5, PostgreSQL (Supabase), TypeScript, shadcn/ui, Tailwind CSS

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `prisma/schema.prisma` | Modify | Remove `@unique`, rename `student` → `students` |
| `prisma/migrations/20260502000000_remove_student_mentor_unique/migration.sql` | Create | Migration record (already applied manually in Supabase) |
| `src/generated/prisma/` | Regenerate | Updated Prisma client |
| `src/app/(app)/admin/actions.ts` | Modify | Remove guards, fix includes for 1:N |
| `src/app/(app)/admin/page.tsx` | Modify | Update query, rename variable, map `studentCount` |
| `src/app/(app)/admin/student-list.tsx` | Modify | `studentCount: number` type, remove filter |
| `src/app/(app)/admin/create-student-form.tsx` | Modify | `studentCount: number` type, remove filter |
| `src/app/(app)/mentores/page.tsx` | Modify | Switch to `students[]` include, update display |
| `src/app/(app)/mentores/[id]/page.tsx` | Modify | Switch to `students[]` include, list all students |
| `src/app/(app)/dashboard/page.tsx` | Modify | SupervisorDashboard + MentorDashboard + `searchParams` |
| `src/components/student-tabs.tsx` | Create | Tab bar for switching active student |
| `src/app/(app)/mi-estudiante/page.tsx` | Modify | `findFirst` + redirect to `/dashboard?alumno=<id>` |
| `src/app/(app)/metas/page.tsx` | Modify | `findFirst` only |
| `src/app/(app)/programacion/page.tsx` | Modify | `searchParams` + `activeStudent` + tabs |

---

## Task 1: Schema change

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Edit schema.prisma — remove `@unique` and rename relation**

  In `prisma/schema.prisma`, make these two changes:

  **In the `Student` model** (line 40), change:
  ```prisma
  mentorId  String?   @unique
  ```
  to:
  ```prisma
  mentorId  String?
  ```

  **In the `User` model** (line 29), change:
  ```prisma
  student      Student?
  ```
  to:
  ```prisma
  students     Student[]
  ```

  The final `User` model should look like:
  ```prisma
  model User {
    id           String    @id @default(cuid())
    name         String
    email        String    @unique
    passwordHash String
    role         Role      @default(MENTOR)
    createdAt    DateTime  @default(now())

    students     Student[]
    sessions     Session[]

    @@map("users")
  }
  ```

  The final `Student` model should look like:
  ```prisma
  model Student {
    id        String    @id @default(cuid())
    name      String
    age       Int
    grade     String
    mentorId  String?
    createdAt DateTime  @default(now())

    mentor    User?     @relation(fields: [mentorId], references: [id])
    sessions  Session[]
    goals     Goal[]

    @@map("students")
  }
  ```

---

## Task 2: SQL migration

**Files:**
- Create: `prisma/migrations/20260502000000_remove_student_mentor_unique/migration.sql`

- [ ] **Step 1: Verify index name in Supabase SQL Editor**

  Run this query in the Supabase SQL Editor (Dashboard → SQL Editor):
  ```sql
  SELECT indexname FROM pg_indexes WHERE tablename = 'students';
  ```
  Confirm the index named `students_mentorId_key` exists.

- [ ] **Step 2: Drop the index in Supabase SQL Editor**

  ```sql
  DROP INDEX "students_mentorId_key";
  ```

  This is non-destructive — no data is modified. All existing `mentorId` values remain.

- [ ] **Step 3: Create the migration file**

  Create directory `prisma/migrations/20260502000000_remove_student_mentor_unique/` and create `migration.sql` inside it with this content:
  ```sql
  DROP INDEX "students_mentorId_key";
  ```

  This file tells Prisma that the migration has already been applied, keeping `prisma migrate status` clean.

---

## Task 3: Regenerate Prisma client

- [ ] **Step 1: Run prisma generate**

  ```bash
  npx prisma generate
  ```

  Expected output: `✔ Generated Prisma Client ... to src/generated/prisma`

  The generated client in `src/generated/prisma/` will now have `User.students: Student[]` instead of `User.student: Student | null`.

  > ⚠️ After this step, TypeScript will flag every file that still references `user.student` (singular). That's expected — the subsequent tasks fix each one.

---

## Task 4: Admin server actions

**Files:**
- Modify: `src/app/(app)/admin/actions.ts`

- [ ] **Step 1: Fix `createStudent` — remove guard and update include**

  Find the `createStudent` function. Replace the mentor-fetch block:

  ```ts
  // BEFORE (lines 56-69):
  if (mentorId) {
    const mentor = await prisma.user.findUnique({
      where: { id: mentorId, role: "MENTOR" },
      include: { student: true },
    });

    if (!mentor) {
      throw new Error("El mentor seleccionado no existe");
    }

    if (mentor.student) {
      throw new Error("Este mentor ya tiene un alumno asignado");
    }
  }
  ```

  With:

  ```ts
  // AFTER:
  if (mentorId) {
    const mentor = await prisma.user.findUnique({
      where: { id: mentorId, role: "MENTOR" },
    });

    if (!mentor) {
      throw new Error("El mentor seleccionado no existe");
    }
  }
  ```

- [ ] **Step 2: Fix `reassignStudent` — remove guard and update include**

  Find the `reassignStudent` function. Replace the newMentor fetch block:

  ```ts
  // BEFORE (lines 92-103):
  const newMentor = await prisma.user.findUnique({
    where: { id: newMentorId, role: "MENTOR" },
    include: { student: true },
  });

  if (!newMentor) {
    throw new Error("El mentor seleccionado no existe");
  }

  if (newMentor.student) {
    throw new Error("Este mentor ya tiene un alumno asignado");
  }
  ```

  With:

  ```ts
  // AFTER:
  const newMentor = await prisma.user.findUnique({
    where: { id: newMentorId, role: "MENTOR" },
  });

  if (!newMentor) {
    throw new Error("El mentor seleccionado no existe");
  }
  ```

- [ ] **Step 3: Fix `deleteUser` — update include and unassign block**

  Find the `deleteUser` function. Replace:

  ```ts
  // BEFORE (lines 143-156):
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true },
  });

  if (!user) throw new Error("Usuario no encontrado");

  // Unassign their student first (if any)
  if (user.student) {
    await prisma.student.update({
      where: { id: user.student.id },
      data: { mentorId: null },
    });
  }
  ```

  With:

  ```ts
  // AFTER:
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { students: { select: { id: true } } },
  });

  if (!user) throw new Error("Usuario no encontrado");

  // Unassign all their students first (if any)
  await prisma.student.updateMany({
    where: { mentorId: userId },
    data: { mentorId: null },
  });
  ```

- [ ] **Step 4: Verify TypeScript in this file**

  ```bash
  npx tsc --noEmit 2>&1 | grep "admin/actions"
  ```

  Expected: no output (no errors in this file).

---

## Task 5: Admin page, student-list, create-student-form

**Files:**
- Modify: `src/app/(app)/admin/page.tsx`
- Modify: `src/app/(app)/admin/student-list.tsx`
- Modify: `src/app/(app)/admin/create-student-form.tsx`

These three files are updated together because `admin/page.tsx` feeds `Mentor[]` props to the other two — changing the shape atomically avoids intermediate type errors.

- [ ] **Step 1: Update `admin/page.tsx` query and variable**

  Find the `mentorsWithStudents` query (around line 19). Replace:

  ```ts
  // BEFORE:
  mentorsWithStudents: prisma.user.findMany({
    where: { role: "MENTOR" },
    select: { id: true, name: true, student: { select: { id: true } } },
  }),
  ```

  With:

  ```ts
  // AFTER:
  mentors: prisma.user.findMany({
    where: { role: "MENTOR" },
    select: { id: true, name: true, _count: { select: { students: true } } },
  }),
  ```

  Then update the destructuring at line 14:
  ```ts
  // BEFORE:
  const [users, mentorsWithStudents, students] = await Promise.all([...]);
  ```
  ```ts
  // AFTER:
  const [users, mentors, students] = await Promise.all([...]);
  ```

  Then update the `mentorsForForm` mapping:
  ```ts
  // BEFORE:
  const mentorsForForm = mentorsWithStudents.map((m) => ({
    id: m.id,
    name: m.name,
    hasStudent: !!m.student,
  }));
  ```
  ```ts
  // AFTER:
  const mentorsForForm = mentors.map((m) => ({
    id: m.id,
    name: m.name,
    studentCount: m._count.students,
  }));
  ```

- [ ] **Step 2: Update `student-list.tsx` — type and filter**

  Replace the `Mentor` type and `availableMentors` line:

  ```ts
  // BEFORE:
  type Mentor = { id: string; name: string; hasStudent: boolean };

  export function StudentList({ students, mentors }: { students: Student[]; mentors: Mentor[] }) {
    // ...
    const availableMentors = mentors.filter((m) => !m.hasStudent);
  ```

  ```ts
  // AFTER:
  type Mentor = { id: string; name: string; studentCount: number };

  export function StudentList({ students, mentors }: { students: Student[]; mentors: Mentor[] }) {
    // ...
    // (remove the availableMentors line entirely)
  ```

  Then update the `<SelectContent>` to use `mentors` directly instead of `availableMentors`, and show `studentCount` for context:

  ```tsx
  // BEFORE:
  <SelectContent>
    {availableMentors.map((m) => (
      <SelectItem key={m.id} value={m.id}>
        {m.name}
      </SelectItem>
    ))}
  </SelectContent>
  ```

  ```tsx
  // AFTER:
  <SelectContent>
    {mentors.map((m) => (
      <SelectItem key={m.id} value={m.id}>
        {m.name}{m.studentCount > 0 ? ` (${m.studentCount} ${m.studentCount === 1 ? "alumno" : "alumnos"})` : ""}
      </SelectItem>
    ))}
  </SelectContent>
  ```

- [ ] **Step 3: Update `create-student-form.tsx` — type and filter**

  Replace the `Mentor` type and `availableMentors` line:

  ```ts
  // BEFORE:
  type Mentor = { id: string; name: string; hasStudent: boolean };

  export function CreateStudentForm({ mentors }: { mentors: Mentor[] }) {
    // ...
    const availableMentors = mentors.filter((m) => !m.hasStudent);
  ```

  ```ts
  // AFTER:
  type Mentor = { id: string; name: string; studentCount: number };

  export function CreateStudentForm({ mentors }: { mentors: Mentor[] }) {
    // ...
    // (remove the availableMentors line entirely)
  ```

  Then update the `<SelectContent>` to use `mentors` directly:

  ```tsx
  // BEFORE:
  <SelectContent>
    <SelectItem value="none">Sin asignar</SelectItem>
    {availableMentors.map((m) => (
      <SelectItem key={m.id} value={m.id}>
        {m.name}
      </SelectItem>
    ))}
  </SelectContent>
  ```

  ```tsx
  // AFTER:
  <SelectContent>
    <SelectItem value="none">Sin asignar</SelectItem>
    {mentors.map((m) => (
      <SelectItem key={m.id} value={m.id}>
        {m.name}{m.studentCount > 0 ? ` (${m.studentCount} ${m.studentCount === 1 ? "alumno" : "alumnos"})` : ""}
      </SelectItem>
    ))}
  </SelectContent>
  ```

- [ ] **Step 4: Verify these three files**

  ```bash
  npx tsc --noEmit 2>&1 | grep -E "admin/(page|student-list|create-student-form)"
  ```

  Expected: no output.

- [ ] **Step 5: Commit**

  ```bash
  git add prisma/schema.prisma prisma/migrations/20260502000000_remove_student_mentor_unique/migration.sql src/app/\(app\)/admin/actions.ts src/app/\(app\)/admin/page.tsx src/app/\(app\)/admin/student-list.tsx src/app/\(app\)/admin/create-student-form.tsx
  git commit -m "feat: lift 1:1 mentor-student constraint in schema and admin panel"
  ```

---

## Task 6: Mentores list page

**Files:**
- Modify: `src/app/(app)/mentores/page.tsx`

- [ ] **Step 1: Update the Prisma query**

  Replace:
  ```ts
  // BEFORE:
  const mentors = await prisma.user.findMany({
    where: { role: "MENTOR" },
    include: {
      student: true,
      sessions: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });
  ```

  With:
  ```ts
  // AFTER:
  const mentors = await prisma.user.findMany({
    where: { role: "MENTOR" },
    include: {
      students: { select: { id: true, name: true } },
      sessions: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });
  ```

- [ ] **Step 2: Update the student display cell**

  Replace:
  ```tsx
  // BEFORE:
  <TableCell>
    {mentor.student ? (
      <Link
        href={`/estudiantes/${mentor.student.id}`}
        className="text-primary hover:underline"
      >
        {mentor.student.name}
      </Link>
    ) : (
      <Badge variant="outline">Sin estudiante</Badge>
    )}
  </TableCell>
  ```

  With:
  ```tsx
  // AFTER:
  <TableCell>
    {mentor.students.length === 0 ? (
      <Badge variant="outline">Sin estudiante</Badge>
    ) : mentor.students.length === 1 ? (
      <Link
        href={`/estudiantes/${mentor.students[0].id}`}
        className="text-primary hover:underline"
      >
        {mentor.students[0].name}
      </Link>
    ) : (
      <Badge variant="secondary">
        {mentor.students.length} alumnos
      </Badge>
    )}
  </TableCell>
  ```

- [ ] **Step 3: Verify and commit**

  ```bash
  npx tsc --noEmit 2>&1 | grep "mentores/page"
  ```
  Expected: no output.

  ```bash
  git add src/app/\(app\)/mentores/page.tsx
  git commit -m "feat: update mentores list for 1:N students"
  ```

---

## Task 7: Mentor profile page

**Files:**
- Modify: `src/app/(app)/mentores/[id]/page.tsx`

- [ ] **Step 1: Update the Prisma query**

  Replace:
  ```ts
  // BEFORE (lines 21-30):
  const mentor = await prisma.user.findUnique({
    where: { id },
    include: {
      student: true,
      sessions: {
        include: { student: true },
        orderBy: { date: "asc" },
      },
    },
  });
  ```

  With:
  ```ts
  // AFTER:
  const mentor = await prisma.user.findUnique({
    where: { id },
    include: {
      students: { select: { id: true, name: true } },
      sessions: {
        include: { student: true },
        orderBy: { date: "asc" },
      },
    },
  });
  ```

- [ ] **Step 2: Update the "Alumno asignado" section in JSX**

  Find the section starting around line 62:
  ```tsx
  // BEFORE:
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <User className="h-4 w-4" />
    Alumno asignado:{" "}
    {mentor.student ? (
      <Link
        href={`/estudiantes/${mentor.student.id}`}
        className="text-primary font-medium hover:underline"
      >
        {mentor.student.name}
      </Link>
    ) : (
      <Badge variant="outline">Sin estudiante</Badge>
    )}
  </div>
  ```

  Replace with:
  ```tsx
  // AFTER:
  <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
    <User className="h-4 w-4" />
    Alumnos asignados:{" "}
    {mentor.students.length === 0 ? (
      <Badge variant="outline">Sin estudiante</Badge>
    ) : (
      mentor.students.map((s, i) => (
        <span key={s.id}>
          <Link
            href={`/estudiantes/${s.id}`}
            className="text-primary font-medium hover:underline"
          >
            {s.name}
          </Link>
          {i < mentor.students.length - 1 && ", "}
        </span>
      ))
    )}
  </div>
  ```

- [ ] **Step 3: Verify and commit**

  ```bash
  npx tsc --noEmit 2>&1 | grep "mentores/\[id\]"
  ```
  Expected: no output.

  ```bash
  git add "src/app/(app)/mentores/[id]/page.tsx"
  git commit -m "feat: update mentor profile page for multiple students"
  ```

---

## Task 8: Supervisor dashboard

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

This file has two separate `include: { student: true }` references — only the one in `user.findMany` (the mentor query) needs updating. The one in `session.findMany` is Session→Student (not User→Student) and must NOT change.

- [ ] **Step 1: Update the user.findMany include**

  Find `SupervisorDashboard` function. In the `prisma.user.findMany` call (first item in `Promise.all`):

  ```ts
  // BEFORE:
  prisma.user.findMany({
    where: { role: "MENTOR" },
    include: { student: true },
  }),
  ```

  ```ts
  // AFTER:
  prisma.user.findMany({
    where: { role: "MENTOR" },
    include: { students: { select: { id: true } } },
  }),
  ```

- [ ] **Step 2: Update the mentorsWithoutStudent filter**

  Find line ~345:
  ```ts
  // BEFORE:
  const mentorsWithoutStudent = mentors.filter((m) => !m.student);
  ```

  ```ts
  // AFTER:
  const mentorsWithoutStudent = mentors.filter((m) => m.students.length === 0);
  ```

- [ ] **Step 3: Verify and commit**

  ```bash
  npx tsc --noEmit 2>&1 | grep "dashboard/page"
  ```
  Expected: no output (the session.findMany include should still compile fine as-is).

  ```bash
  git add src/app/\(app\)/dashboard/page.tsx
  git commit -m "feat: update supervisor dashboard for 1:N mentor-student"
  ```

---

## Task 9: Create StudentTabs component

**Files:**
- Create: `src/components/student-tabs.tsx`

- [ ] **Step 1: Create the component file**

  Create `src/components/student-tabs.tsx`:

  ```tsx
  "use client";

  import Link from "next/link";

  type Student = {
    id: string;
    name: string;
  };

  export function StudentTabs({
    students,
    activeId,
  }: {
    students: Student[];
    activeId: string;
  }) {
    if (students.length <= 1) return null;

    return (
      <div className="flex gap-2 flex-wrap">
        {students.map((student) => {
          const isActive = student.id === activeId;
          const firstName = student.name.split(" ")[0];
          return (
            <Link
              key={student.id}
              href={`?alumno=${student.id}`}
              className={
                isActive
                  ? "px-4 py-2 rounded-lg text-sm font-semibold bg-[#1e3a5f] text-white"
                  : "px-4 py-2 rounded-lg text-sm font-medium bg-white text-[#1e3a5f] border border-[#1e3a5f]/20 hover:bg-[#1e3a5f]/5 transition-colors"
              }
            >
              {firstName}
            </Link>
          );
        })}
      </div>
    );
  }
  ```

  Note: No `useSearchParams` needed — the active state is determined by the `activeId` prop passed from the server component. The tabs are plain `<Link>` elements, no client-side state needed.

- [ ] **Step 2: Verify TypeScript**

  ```bash
  npx tsc --noEmit 2>&1 | grep "student-tabs"
  ```
  Expected: no output.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/student-tabs.tsx
  git commit -m "feat: add StudentTabs component for multi-student switching"
  ```

---

## Task 10: MentorDashboard — searchParams + active student

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

The `DashboardPage` component currently has no props. We need to:
1. Add `searchParams` prop to `DashboardPage`
2. Pass `alumnoId` down to `MentorDashboard`
3. In `MentorDashboard`: resolve `activeStudent` from `alumnoId` param and scope all queries to it
4. Render `<StudentTabs>` when there are multiple students

- [ ] **Step 1: Update `DashboardPage` signature and prop threading**

  Find the top of the file:
  ```ts
  // BEFORE:
  export default async function DashboardPage() {
    const user = await getCurrentUser();

    if (user.role === "SUPERVISOR") {
      return <SupervisorDashboard userId={user.id} />;
    }

    if (user.role === "SUBSTITUTE") {
      return <SubstituteDashboard userId={user.id} userName={user.name ?? "Suplente"} />;
    }

    return <MentorDashboard userId={user.id} userName={user.name ?? "Mentor"} />;
  }
  ```

  Replace with:
  ```ts
  // AFTER:
  export default async function DashboardPage({
    searchParams,
  }: {
    searchParams: Promise<{ alumno?: string }>;
  }) {
    const user = await getCurrentUser();
    const { alumno } = await searchParams;

    if (user.role === "SUPERVISOR") {
      return <SupervisorDashboard userId={user.id} />;
    }

    if (user.role === "SUBSTITUTE") {
      return <SubstituteDashboard userId={user.id} userName={user.name ?? "Suplente"} />;
    }

    return <MentorDashboard userId={user.id} userName={user.name ?? "Mentor"} alumnoId={alumno} />;
  }
  ```

- [ ] **Step 2: Update `MentorDashboard` function signature**

  Find:
  ```ts
  // BEFORE:
  async function MentorDashboard({ userId, userName }: { userId: string; userName: string }) {
  ```

  Replace with:
  ```ts
  // AFTER:
  async function MentorDashboard({
    userId,
    userName,
    alumnoId,
  }: {
    userId: string;
    userName: string;
    alumnoId?: string;
  }) {
  ```

- [ ] **Step 3: Add orderBy to the existing findMany call and resolve activeStudent**

  Find the existing `findMany` call (around line 43):
  ```ts
  // BEFORE:
  const students = await prisma.student.findMany({
    where: { mentorId: userId },
    include: {
      sessions: {
        orderBy: { date: "desc" },
        take: 1,
        include: {
          evaluation: true,
          mentor: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  const student = students[0] ?? null;
  ```

  Replace with:
  ```ts
  // AFTER:
  const students = await prisma.student.findMany({
    where: { mentorId: userId },
    orderBy: { name: "asc" },
    include: {
      sessions: {
        orderBy: { date: "desc" },
        take: 1,
        include: {
          evaluation: true,
          mentor: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  const activeStudent =
    students.find((s) => s.id === alumnoId) ?? students[0] ?? null;
  ```

- [ ] **Step 4: Rename all `student` references to `activeStudent` in MentorDashboard**

  After the `activeStudent` declaration, find every reference to the old `student` variable (lines like `student?.name`, `student.id`, `student?.sessions`, etc.) and rename to `activeStudent`. There are roughly these references to update:

  ```ts
  // Each of these references to `student` must become `activeStudent`:
  const sessionCount = student
    ? await prisma.session.count({ where: { studentId: student.id } })
    : 0;

  const lastSession = student?.sessions[0];
  // ...
  const studentInitials = student?.name
  ```

  Change every occurrence of the old `student` variable to `activeStudent`. Be careful NOT to rename `students` (plural) or type names.

- [ ] **Step 5: Add `StudentTabs` import and render it**

  Add the import at the top of the file with the other imports:
  ```ts
  import { StudentTabs } from "@/components/student-tabs";
  ```

  In the JSX returned by `MentorDashboard`, find the opening `<div className="space-y-8 max-w-6xl mx-auto">` and add `<StudentTabs>` as the first child:

  ```tsx
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {students.length > 1 && (
        <StudentTabs
          students={students.map((s) => ({ id: s.id, name: s.name }))}
          activeId={activeStudent?.id ?? ""}
        />
      )}
      {/* Welcome Hero */}
      <header ...>
  ```

- [ ] **Step 6: Verify and commit**

  ```bash
  npx tsc --noEmit 2>&1 | grep "dashboard/page"
  ```
  Expected: no output.

  ```bash
  git add src/app/\(app\)/dashboard/page.tsx
  git commit -m "feat: add multi-student switching to MentorDashboard"
  ```

---

## Task 11: /mi-estudiante — findFirst + redirect to dashboard

**Files:**
- Modify: `src/app/(app)/mi-estudiante/page.tsx`

- [ ] **Step 1: Replace findUnique with findFirst and change redirect target**

  Current file (`src/app/(app)/mi-estudiante/page.tsx`):
  ```ts
  // BEFORE:
  const student = await prisma.student.findUnique({
    where: { mentorId: user.id },
  });

  if (!student) redirect("/dashboard");

  redirect(`/estudiantes/${student.id}`);
  ```

  Replace with:
  ```ts
  // AFTER:
  const student = await prisma.student.findFirst({
    where: { mentorId: user.id },
    orderBy: { name: "asc" },
  });

  if (!student) redirect("/dashboard");

  redirect(`/dashboard?alumno=${student.id}`);
  ```

- [ ] **Step 2: Verify and commit**

  ```bash
  npx tsc --noEmit 2>&1 | grep "mi-estudiante"
  ```
  Expected: no output.

  ```bash
  git add src/app/\(app\)/mi-estudiante/page.tsx
  git commit -m "feat: update mi-estudiante to redirect to dashboard with alumno param"
  ```

---

## Task 12: /metas — findFirst only

**Files:**
- Modify: `src/app/(app)/metas/page.tsx`

- [ ] **Step 1: Replace findUnique with findFirst**

  Current file:
  ```ts
  // BEFORE:
  const student = await prisma.student.findUnique({
    where: { mentorId: user.id },
  });
  ```

  Replace with:
  ```ts
  // AFTER:
  const student = await prisma.student.findFirst({
    where: { mentorId: user.id },
    orderBy: { name: "asc" },
  });
  ```

  The redirect target `/estudiantes/${student.id}?tab=metas` stays unchanged.

- [ ] **Step 2: Verify and commit**

  ```bash
  npx tsc --noEmit 2>&1 | grep "metas/page"
  ```
  Expected: no output.

  ```bash
  git add src/app/\(app\)/metas/page.tsx
  git commit -m "feat: update metas page to use findFirst for multi-student mentors"
  ```

---

## Task 13: /programacion — searchParams + active student + tabs

**Files:**
- Modify: `src/app/(app)/programacion/page.tsx`

- [ ] **Step 1: Add searchParams to the page function signature**

  Find:
  ```ts
  // BEFORE:
  export default async function ProgramacionPage() {
    const user = await getCurrentUser();
  ```

  Replace with:
  ```ts
  // AFTER:
  export default async function ProgramacionPage({
    searchParams,
  }: {
    searchParams: Promise<{ alumno?: string }>;
  }) {
    const user = await getCurrentUser();
    const { alumno } = await searchParams;
  ```

- [ ] **Step 2: Fetch all mentor students and resolve activeStudent**

  Find the existing mentor fetch block (around lines 17-34):
  ```ts
  // BEFORE:
  let completedTopics = new Map<string, { notes: string; date: Date }>();
  if (user.role === "MENTOR") {
    const student = await prisma.student.findFirst({
      where: { mentorId: user.id },
      include: {
        sessions: {
          select: { formationTopic: true, notes: true, date: true },
        },
      },
    });
    if (student) {
      for (const session of student.sessions) {
        completedTopics.set(session.formationTopic, {
          notes: session.notes,
          date: session.date,
        });
      }
    }
  }
  ```

  Replace with:
  ```ts
  // AFTER:
  let completedTopics = new Map<string, { notes: string; date: Date }>();
  let allStudents: { id: string; name: string }[] = [];
  let activeStudentId: string | undefined;

  if (user.role === "MENTOR") {
    const students = await prisma.student.findMany({
      where: { mentorId: user.id },
      orderBy: { name: "asc" },
      include: {
        sessions: {
          select: { formationTopic: true, notes: true, date: true },
        },
      },
    });

    allStudents = students.map((s) => ({ id: s.id, name: s.name }));
    const activeStudent =
      students.find((s) => s.id === alumno) ?? students[0] ?? null;
    activeStudentId = activeStudent?.id;

    if (activeStudent) {
      for (const session of activeStudent.sessions) {
        completedTopics.set(session.formationTopic, {
          notes: session.notes,
          date: session.date,
        });
      }
    }
  }
  ```

- [ ] **Step 3: Add StudentTabs import**

  Add at the top of the file:
  ```ts
  import { StudentTabs } from "@/components/student-tabs";
  ```

- [ ] **Step 4: Render StudentTabs in JSX**

  Find the opening JSX `<div className="space-y-8">` and add tabs as the second child (after the hero header block):

  ```tsx
  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="rounded-2xl bg-gradient-to-br ...">
        ...
      </div>

      {/* Student tabs for mentors with multiple students */}
      {user.role === "MENTOR" && allStudents.length > 1 && activeStudentId && (
        <StudentTabs students={allStudents} activeId={activeStudentId} />
      )}

      {/* rest of the page content */}
  ```

- [ ] **Step 5: Verify and commit**

  ```bash
  npx tsc --noEmit 2>&1 | grep "programacion/page"
  ```
  Expected: no output.

  ```bash
  git add src/app/\(app\)/programacion/page.tsx
  git commit -m "feat: add multi-student switching to programacion page"
  ```

---

## Task 14: Full TypeScript check + push

- [ ] **Step 1: Run full TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: zero errors. If errors appear, fix them before proceeding.

  Common sources of remaining errors after previous tasks:
  - Any server component that still uses `mentor.student` (singular) somewhere not yet updated
  - Any TypeScript generic that inferred the old relation type

- [ ] **Step 2: Push to remote**

  ```bash
  git push
  ```

---

## Verification Checklist

After all tasks complete, verify manually in the app:

| Scenario | Expected |
|----------|----------|
| Mentor with 1 student opens `/dashboard` | No tabs visible; behavior same as before |
| Supervisor assigns 2nd student to a mentor | No error ("ya tiene un alumno") — succeeds |
| Mentor with 2 students opens `/dashboard` | Two tabs visible at top |
| Click second student tab | URL becomes `?alumno=<id2>`, dashboard data updates |
| Open `/dashboard` with invalid `?alumno=xxx` | Defaults to first student |
| Supervisor opens `/mentores` | Mentor with 2 students shows "2 alumnos" badge |
| Supervisor opens `/mentores/[id]` | Both students listed as links under "Alumnos asignados:" |
| Supervisor creates student, selects mentor with 1 student | No error; mentor now has 2 students |
| Mentor opens `/programacion` with 2 students | Tabs visible; completed topics update when switching |
| Sidebar "Mi Estudiante" clicked | Redirects to `/dashboard?alumno=<firstStudentId>` |
| Sidebar "Metas" clicked | Redirects to `/estudiantes/<firstStudentId>?tab=metas` |
| Supervisor deletes a mentor with 2 students | Both students unassigned; mentor deleted |
