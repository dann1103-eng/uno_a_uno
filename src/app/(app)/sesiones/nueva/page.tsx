import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionForm } from "@/components/session-form";
import { PROGRAMMING_TOPICS } from "@/lib/programming-topics";
import { PlusCircle } from "lucide-react";

export default async function NuevaSesionPage() {
  const user = await getCurrentUser();

  if (user.role !== "MENTOR") redirect("/dashboard");

  const students = await prisma.student.findMany({
    where: { mentorId: user.id },
    select: { id: true, name: true },
  });

  if (students.length === 0) redirect("/dashboard");

  const topics = PROGRAMMING_TOPICS.map((t) => ({
    id: String(t.number),
    title: t.title,
    weekNumber: t.number,
  }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#022448] p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <PlusCircle className="h-6 w-6 text-[#eec058]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#eec058]">
            Registro
          </span>
        </div>
        <h1 className="text-2xl font-bold mt-2">Nueva Sesión</h1>
        <p className="text-sm text-white/70 mt-1">
          Registra una nueva sesión de mentoría
        </p>
      </div>
      <SessionForm topics={topics} students={students} />
    </div>
  );
}
