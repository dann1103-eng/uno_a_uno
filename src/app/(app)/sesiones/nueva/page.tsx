import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionForm } from "@/components/session-form";
import { TOPIC_ITEMS } from "@/lib/programming-topics";
import Link from "next/link";

export default async function NuevaSesionPage() {
  const user = await getCurrentUser();

  if (user.role !== "MENTOR") redirect("/dashboard");

  const students = await prisma.student.findMany({
    where: { mentorId: user.id },
    select: { id: true, name: true },
  });

  if (students.length === 0) redirect("/dashboard");

  const topics = TOPIC_ITEMS.map((t) => ({
    id: String(t.number),
    title: t.title,
    weekNumber: t.number,
  }));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#5b4300]">
            Gestión Académica
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#022448] tracking-tight">
            Nueva Sesión
          </h1>
          <p className="text-lg text-[#43474e] font-medium">
            Registra una nueva sesión de mentoría
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-lg bg-[#e9e7eb] text-[#3e4757] font-bold text-sm hover:bg-[#dad9dd] transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            form="session-form"
            className="px-8 py-3 rounded-lg bg-gradient-to-br from-[#d4a843] to-[#eec058] text-[#001c3b] font-bold text-sm shadow-md hover:shadow-lg transition-all"
          >
            Guardar sesión
          </button>
        </div>
      </header>

      <SessionForm topics={topics} students={students} />
    </div>
  );
}
