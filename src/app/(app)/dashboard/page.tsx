import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/button-variants";
import Link from "next/link";
import {
  BookOpen,
  PlusCircle,
  User,
  Calendar,
  Users,
  GraduationCap,
  HandHelping,
  AlertCircle,
  Zap,
  Clock,
  CheckCircle2,
  Circle,
  ArrowRight,
  Library,
  Brain,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TOPIC_ITEMS } from "@/lib/programming-topics";

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

async function MentorDashboard({ userId, userName }: { userId: string; userName: string }) {
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

  const sessionCount = student
    ? await prisma.session.count({ where: { studentId: student.id } })
    : 0;

  const lastSession = student?.sessions[0];
  const nextTopic = TOPIC_ITEMS[sessionCount] ?? TOPIC_ITEMS[0];
  const totalTopics = TOPIC_ITEMS.length;

  // Calculate initials for avatar
  const studentInitials = student?.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "";

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Hero */}
      <header className="relative overflow-hidden rounded-2xl bg-[#1e3a5f] p-10 md:p-12 text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
              <HandHelping className="h-4 w-4 text-[#eec058]" />
              <span className="text-xs font-bold tracking-widest uppercase">PANEL DEL MENTOR</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Bienvenido, {userName.split(" ")[0]}
            </h1>
            <p className="text-blue-100/80 max-w-xl text-base leading-relaxed">
              Guía con amor, inspira con el ejemplo. Tu presencia está iluminando el camino de crecimiento de tu mentorado.
            </p>
          </div>
          <div className="hidden xl:block">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#eec058]/20 rounded-full blur-3xl"></div>
              <HandHelping className="h-24 w-24 text-[#eec058]/30" strokeWidth={1} />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#022448]/50 to-transparent pointer-events-none"></div>
      </header>

      {!student ? (
        <div className="bg-white p-6 rounded-xl shadow-[0_12px_32px_rgba(2,36,72,0.06)] flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <p className="text-muted-foreground">No tienes un estudiante asignado aún. Contacta a tu supervisor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Student Profile */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-8 rounded-xl shadow-[0_20px_40px_rgba(2,36,72,0.05)] border border-[#c4c6cf]/15 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-full border-4 border-[#eec058] p-1 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-2xl font-bold">
                    {studentInitials}
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 bg-[#022448] text-white p-1.5 rounded-full border-4 border-white">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[#022448] mb-1">{student.name}</h2>
              <p className="text-muted-foreground font-medium mb-6">
                {student.age} años · {student.grade}
              </p>

              {/* Stats */}
              <div className="w-full space-y-3 mb-8">
                <div className="flex items-center justify-between p-4 bg-[#f4f3f7] rounded-xl">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-[#1e3a5f]" />
                    <span className="text-sm font-semibold">Sesiones</span>
                  </div>
                  <span className="text-xl font-bold text-[#1e3a5f]">{sessionCount}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#f4f3f7] rounded-xl">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-[#1e3a5f]" />
                    <span className="text-sm font-semibold">Progreso</span>
                  </div>
                  <span className="text-sm font-bold text-[#c89d39] bg-[#ffdf9f] px-3 py-1 rounded-full">
                    Tema {Math.min(sessionCount + 1, totalTopics)} / {totalTopics}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-3">
                <Link
                  href="/sesiones/nueva"
                  className="w-full py-4 bg-[#1e3a5f] text-white rounded-full font-bold shadow-lg hover:shadow-[#1e3a5f]/20 transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle className="h-5 w-5" />
                  Nueva Sesión
                </Link>
                <Link
                  href={`/estudiantes/${student.id}`}
                  className="w-full py-4 bg-white text-[#022448] border border-[#c4c6cf] rounded-full font-bold hover:bg-[#f4f3f7] transition-all flex items-center justify-center"
                >
                  Ver Perfil Completo
                </Link>
              </div>
            </section>
          </div>

          {/* Right Column: Stats and Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Next Challenge + Next Session */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nextTopic && (
                <div className="bg-[#f4f3f7] p-6 rounded-xl border border-[#c4c6cf]/10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-[#ffdf9f] rounded-xl text-[#261a00]">
                      <Zap className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-[#022448]">Próximo Desafío</h3>
                  </div>
                  <p className="text-lg font-bold text-[#022448] leading-tight">
                    Tema {nextTopic.number} - {nextTopic.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Preparar material de apoyo para la próxima sesión.
                  </p>
                </div>
              )}
              <div className="bg-[#022448] text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl text-white">
                      <Clock className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold">Siguiente Cita</h3>
                  </div>
                  {lastSession ? (
                    <>
                      <p className="text-xl font-bold">Próxima semana</p>
                      <p className="text-blue-200">
                        Última: {new Date(lastSession.date).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                      </p>
                    </>
                  ) : (
                    <p className="text-lg">Agenda tu primera sesión</p>
                  )}
                </div>
                <Calendar className="h-20 w-20 text-white/5 absolute -bottom-4 -right-4" />
              </div>
            </div>

            {/* Last Session Card */}
            {lastSession && (
              <section className="bg-white p-8 rounded-xl shadow-[0_20px_40px_rgba(2,36,72,0.05)] border border-[#c4c6cf]/15">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-8 bg-[#eec058] rounded-full"></div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#022448]">Última Sesión</h2>
                      {lastSession.mentor && lastSession.mentorId !== userId && (
                        <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                          Dada por: {lastSession.mentor.name} ({lastSession.mentor.role === "SUBSTITUTE" ? "Suplente" : "Supervisor"})
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-muted-foreground">
                    {new Date(lastSession.date).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[0.65rem] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">
                        TEMA TRATADO
                      </label>
                      <p className="text-xl font-bold text-[#022448]">{lastSession.formationTopic}</p>
                    </div>
                    {lastSession.notes && (
                      <div>
                        <label className="text-[0.65rem] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">
                          NOTAS DE LA SESIÓN
                        </label>
                        <p className="text-muted-foreground leading-relaxed italic line-clamp-3">
                          &ldquo;{lastSession.notes}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                  {lastSession.nextSteps && (
                    <div className="bg-[#f4f3f7] p-6 rounded-xl space-y-4">
                      <label className="text-[0.65rem] font-bold tracking-widest text-muted-foreground uppercase block">
                        PRÓXIMOS PASOS
                      </label>
                      <ul className="space-y-3">
                        {lastSession.nextSteps.split(/[.\n]/).filter(Boolean).map((step, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <Circle className="h-4 w-4 text-[#1e3a5f] mt-0.5 shrink-0" />
                            <span className="text-sm text-[#1a1c1e]">{step.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="mt-8 pt-6 border-t border-[#c4c6cf]/10 flex justify-end">
                  <Link
                    href={`/estudiantes/${student.id}`}
                    className="text-[#022448] font-bold flex items-center gap-2 hover:translate-x-1 transition-transform text-sm"
                  >
                    Ver resumen detallado
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </section>
            )}

            {/* Quick Resources Bento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/programacion"
                className="bg-[#d5e3ff]/30 p-6 rounded-xl flex flex-col items-center text-center gap-2 cursor-pointer hover:bg-[#d5e3ff]/50 transition-colors"
              >
                <Library className="h-8 w-8 text-[#1e3a5f] mb-2" />
                <h4 className="font-bold text-[#022448] text-sm">Programación</h4>
                <p className="text-xs text-muted-foreground">Guía de temas y formación.</p>
              </Link>
              <Link
                href="/metas"
                className="bg-[#ffdf9f]/20 p-6 rounded-xl flex flex-col items-center text-center gap-2 cursor-pointer hover:bg-[#ffdf9f]/30 transition-colors"
              >
                <Brain className="h-8 w-8 text-[#5b4300] mb-2" />
                <h4 className="font-bold text-[#5b4300] text-sm">Metas</h4>
                <p className="text-xs text-muted-foreground">Objetivos y seguimiento.</p>
              </Link>
              <Link
                href={`/estudiantes/${student.id}`}
                className="bg-[#e9e7eb] p-6 rounded-xl flex flex-col items-center text-center gap-2 cursor-pointer hover:bg-[#dad9dd] transition-colors"
              >
                <MessageSquare className="h-8 w-8 text-[#43474e] mb-2" />
                <h4 className="font-bold text-[#1a1c1e] text-sm">Historial</h4>
                <p className="text-xs text-muted-foreground">Sesiones y métricas.</p>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function SupervisorDashboard({ userId: _userId }: { userId: string }) {
  const [mentors, students, recentSessions, mentorActivity] = await Promise.all([
    prisma.user.findMany({
      where: { role: "MENTOR" },
      include: { student: true },
    }),
    prisma.student.findMany({
      include: { mentor: true },
    }),
    prisma.session.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: { student: true, mentor: { select: { name: true, role: true } } },
    }),
    prisma.user.findMany({
      where: { role: "MENTOR" },
      select: {
        id: true,
        name: true,
        sessions: {
          orderBy: { date: "desc" },
          take: 1,
          select: { formationTopic: true, date: true },
        },
        _count: { select: { sessions: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const sessionCount = await prisma.session.count();
  const mentorsWithoutStudent = mentors.filter((m) => !m.student);
  const studentsWithoutMentor = students.filter((s) => !s.mentor).length;

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-[#022448] tracking-tight mb-2">
            Dashboard Supervisor
          </h1>
          <p className="text-[#43474e]">
            Bienvenido al panel de administración. Aquí está el estado de tu red de mentoría.
          </p>
        </div>
        <Link
          href="/admin"
          className="bg-[#795900] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity text-sm self-start md:self-auto"
        >
          <UserPlus className="h-5 w-5" />
          Gestionar Alumnos
        </Link>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-xl shadow-[0_20px_40px_rgba(30,58,95,0.04)] border-t-4 border-[#1e3a5f]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
              Mentores Activos
            </span>
            <GraduationCap className="h-6 w-6 text-[#1e3a5f]" />
          </div>
          <div className="text-5xl font-extrabold text-[#1e3a5f] tracking-tighter">
            {mentors.length}
          </div>
          {mentorsWithoutStudent.length > 0 && (
            <p className="text-xs text-[#d4a843] font-medium mt-2">
              {mentorsWithoutStudent.length} sin alumno asignado
            </p>
          )}
        </div>

        <div className="bg-white p-8 rounded-xl shadow-[0_20px_40px_rgba(30,58,95,0.04)] border-t-4 border-[#795900]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
              Estudiantes
            </span>
            <Users className="h-6 w-6 text-[#795900]" />
          </div>
          <div className="flex items-baseline gap-4">
            <div className="text-5xl font-extrabold text-[#1e3a5f] tracking-tighter">
              {students.length}
            </div>
            {studentsWithoutMentor > 0 && (
              <div className="bg-[#fece65] text-[#755700] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {studentsWithoutMentor} sin mentor
              </div>
            )}
          </div>
          <p className="text-xs text-[#43474e] mt-2 font-medium">
            {students.length - studentsWithoutMentor} con mentor activo
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-[0_20px_40px_rgba(30,58,95,0.04)] border-t-4 border-[#1e3a5f]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
              Sesiones Totales
            </span>
            <Calendar className="h-6 w-6 text-[#1e3a5f]" />
          </div>
          <div className="text-5xl font-extrabold text-[#1e3a5f] tracking-tighter">
            {sessionCount}
          </div>
          <p className="text-xs text-[#43474e] mt-2 font-medium">Ciclo académico actual</p>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Sessions Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_20px_40px_rgba(30,58,95,0.04)] overflow-hidden">
          <div className="p-6 border-b border-[#c4c6cf]/15 flex justify-between items-center bg-[#f4f3f7]/50">
            <h3 className="text-xl font-bold text-[#022448]">Sesiones Recientes</h3>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#f4f3f7]">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Estudiante
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Mentor
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Tema
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c6cf]/10">
                {recentSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-[#d5e3ff]/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-[#43474e]">
                      {new Date(session.date).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#1e3a5f] text-sm">
                      {session.student.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1a1c1e]">
                      {session.mentor ? (
                        <span>
                          {session.mentor.name}
                          {session.mentor.role === "SUBSTITUTE" && (
                            <span className="ml-1 text-[10px] text-emerald-700 font-bold">(Suplente)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Eliminado</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-[#d5e3ff] text-[#2d486d] px-3 py-1 rounded-md text-[11px] font-semibold">
                        {session.formationTopic}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentSessions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      No hay sesiones registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Mentors without students */}
          {mentorsWithoutStudent.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-[0_20px_40px_rgba(30,58,95,0.04)]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#022448] tracking-tight">
                  Mentores sin alumno
                </h3>
                <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-[10px] font-black">
                  ALERTA
                </span>
              </div>
              <div className="space-y-3">
                {mentorsWithoutStudent.map((mentor) => {
                  const initials = mentor.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() ?? "M";
                  return (
                    <div
                      key={mentor.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-[#f4f3f7] hover:bg-[#e9e7eb] transition-colors border-l-4 border-[#795900]"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-sm font-bold">
                        {initials}
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-sm font-bold text-[#1e3a5f]">{mentor.name}</h4>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#795900]"></span>
                          <span className="text-[11px] text-[#755700] font-medium uppercase tracking-wider">
                            Disponible
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link
                href="/admin"
                className="w-full mt-6 py-3 border-2 border-[#1e3a5f]/20 text-[#1e3a5f] rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-[#1e3a5f] hover:text-white transition-all flex items-center justify-center"
              >
                Ver todos los mentores
              </Link>
            </div>
          )}

          {/* Tutor Activity Widget */}
          <div className="bg-white p-6 rounded-xl shadow-[0_20px_40px_rgba(30,58,95,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#022448] tracking-tight">Actividad de Tutores</h3>
              <Link href="/mentores" className="text-[10px] font-bold uppercase tracking-widest text-[#795900] hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="space-y-2">
              {mentorActivity.map((m) => {
                const lastSession = m.sessions[0];
                const hours = m._count.sessions * 3;
                return (
                  <Link
                    key={m.id}
                    href={`/mentores/${m.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#f4f3f7] hover:bg-[#e9e7eb] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1e3a5f] truncate">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {lastSession ? lastSession.formationTopic : "Sin sesiones"}
                      </p>
                    </div>
                    <div className="shrink-0 ml-3 text-right">
                      <span className="text-sm font-extrabold text-[#795900]">{hours}h</span>
                    </div>
                  </Link>
                );
              })}
              {mentorActivity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Sin tutores registrados</p>
              )}
            </div>
          </div>

          {/* Quick Insights Card */}
          <div className="bg-[#1e3a5f] text-white p-6 rounded-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Resumen del Programa</h3>
              <p className="text-[#8aa4cf] text-sm mb-4">
                {students.length} estudiantes activos en el programa de mentoría uno a uno.
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#eec058]" />
                <span className="text-xs font-bold uppercase tracking-tighter">
                  {sessionCount} sesiones registradas
                </span>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#eec058]/20 rounded-full blur-2xl"></div>
            <div className="absolute -left-8 -top-8 w-24 h-24 bg-[#022448]/40 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function SubstituteDashboard({ userId, userName }: { userId: string; userName: string }) {
  const recentSessions = await prisma.session.findMany({
    where: { mentorId: userId },
    orderBy: { date: "desc" },
    take: 10,
    include: {
      student: { select: { id: true, name: true, grade: true } },
      evaluation: true,
    },
  });

  const uniqueStudents = new Set(recentSessions.map((s) => s.studentId)).size;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Hero */}
      <header className="relative overflow-hidden rounded-2xl bg-[#1e3a5f] p-10 md:p-12 text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
              <HandHelping className="h-4 w-4 text-[#eec058]" />
              <span className="text-xs font-bold tracking-widest uppercase">PANEL DEL SUPLENTE</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Bienvenido, {userName.split(" ")[0]}
            </h1>
            <p className="text-blue-100/80 max-w-xl text-base leading-relaxed">
              Como suplente puedes registrar sesiones para cualquier alumno del programa.
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#022448]/50 to-transparent pointer-events-none"></div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-xl shadow-[0_20px_40px_rgba(30,58,95,0.04)] border-t-4 border-[#1e3a5f]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
              Sesiones Dadas
            </span>
            <Calendar className="h-6 w-6 text-[#1e3a5f]" />
          </div>
          <div className="text-5xl font-extrabold text-[#1e3a5f] tracking-tighter">
            {recentSessions.length}
          </div>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-[0_20px_40px_rgba(30,58,95,0.04)] border-t-4 border-[#795900]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
              Alumnos Atendidos
            </span>
            <GraduationCap className="h-6 w-6 text-[#795900]" />
          </div>
          <div className="text-5xl font-extrabold text-[#1e3a5f] tracking-tighter">
            {uniqueStudents}
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <Link
        href="/sesiones/nueva"
        className="flex items-center gap-3 bg-gradient-to-br from-[#d4a843] to-[#eec058] text-[#001c3b] px-8 py-5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all w-full md:w-auto md:self-start"
      >
        <PlusCircle className="h-5 w-5" />
        Registrar nueva sesión
      </Link>

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl shadow-[0_20px_40px_rgba(30,58,95,0.04)] overflow-hidden">
        <div className="p-6 border-b border-[#c4c6cf]/15 bg-[#f4f3f7]/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#022448]">Mis Sesiones Registradas</h3>
          <Clock className="h-5 w-5 text-muted-foreground" />
        </div>
        {recentSessions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Aún no has registrado ninguna sesión.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#f4f3f7]">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Fecha</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Alumno</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Tema</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c6cf]/10">
                {recentSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-[#d5e3ff]/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-[#43474e]">
                      {new Date(session.date).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/estudiantes/${session.student.id}`} className="font-bold text-[#1e3a5f] text-sm hover:underline">
                        {session.student.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{session.student.grade}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-[#d5e3ff] text-[#2d486d] px-3 py-1 rounded-md text-[11px] font-semibold">
                        {session.formationTopic}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
