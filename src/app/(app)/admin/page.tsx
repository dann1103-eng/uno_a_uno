import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CreateUserForm } from "./create-user-form";
import { CreateStudentForm } from "./create-student-form";
import { StudentList } from "./student-list";
import { UserList } from "./user-list";
import { ShieldCheck } from "lucide-react";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "SUPERVISOR") notFound();

  const [users, mentors, students] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { role: "MENTOR" },
      select: { id: true, name: true, _count: { select: { students: true } } },
    }),
    prisma.student.findMany({
      orderBy: { createdAt: "desc" },
      include: { mentor: { select: { id: true, name: true } } },
    }),
  ]);

  const mentorsForForm = mentors.map((m) => ({
    id: m.id,
    name: m.name,
    studentCount: m._count.students,
  }));

  const studentsForList = students.map((s) => ({
    id: s.id,
    name: s.name,
    age: s.age,
    grade: s.grade,
    mentor: s.mentor,
  }));

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Hero header */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#022448] p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="h-6 w-6 text-[#eec058]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#eec058]">
            Administración
          </span>
        </div>
        <h1 className="text-2xl font-bold mt-2">Panel de Administración</h1>
        <p className="text-sm text-white/70 mt-1">
          Gestiona usuarios y alumnos del programa
        </p>
      </div>

      {/* Section: Users */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[#022448]">Usuarios</h2>
        <CreateUserForm />
        <UserList
          users={users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
          }))}
          currentUserId={currentUser.id!}
        />
      </section>

      {/* Section: Students */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[#022448]">Alumnos</h2>
        <CreateStudentForm mentors={mentorsForForm} />
        <StudentList students={studentsForList} mentors={mentorsForForm} />
      </section>
    </div>
  );
}
