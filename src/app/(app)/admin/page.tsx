import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CreateUserForm } from "./create-user-form";
import { CreateStudentForm } from "./create-student-form";
import { StudentList } from "./student-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "SUPERVISOR") notFound();

  const [users, mentorsWithStudents, students] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { role: "MENTOR" },
      select: { id: true, name: true, student: { select: { id: true } } },
    }),
    prisma.student.findMany({
      orderBy: { createdAt: "desc" },
      include: { mentor: { select: { id: true, name: true } } },
    }),
  ]);

  const mentorsForForm = mentorsWithStudents.map((m) => ({
    id: m.id,
    name: m.name,
    hasStudent: !!m.student,
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
        <Card className="border-none shadow-[0_12px_32px_rgba(2,36,72,0.06)]">
          <CardHeader>
            <CardTitle className="text-base text-[#1e3a5f]">Usuarios registrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between py-3 rounded-lg hover:bg-[#d5e3ff]/10 px-2 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Badge
                  className={
                    user.role === "SUPERVISOR"
                      ? "bg-[#1e3a5f] text-white hover:bg-[#022448]"
                      : "bg-[#d4a843]/15 text-[#5b4300] hover:bg-[#d4a843]/25"
                  }
                >
                  {user.role === "SUPERVISOR" ? "Supervisor" : "Mentor"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
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
