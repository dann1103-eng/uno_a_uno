import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsRadarChart } from "@/components/metrics-radar-chart";
import { SessionsBarChart } from "@/components/sessions-bar-chart";
import { MentorExportButtons } from "@/components/mentor-export-buttons";
import { TOPIC_ITEMS } from "@/lib/programming-topics";
import Link from "next/link";

const HOURS_PER_SESSION = 3;
const TOTAL_TOPICS = TOPIC_ITEMS.length; // 21

function avg(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default async function EstadisticasPage() {
  await requireRole("SUPERVISOR");

  const [students, allSessions, mentorActivity] = await Promise.all([
    prisma.student.findMany({
      include: {
        sessions: {
          include: { evaluation: true },
          orderBy: { date: "asc" },
        },
        mentor: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.session.findMany({
      orderBy: { date: "asc" },
      select: { date: true },
    }),
    prisma.user.findMany({
      where: { role: "MENTOR" },
      select: {
        id: true,
        name: true,
        sessions: {
          orderBy: { date: "desc" },
          take: 1,
          select: { formationTopic: true, date: true, student: { select: { name: true } } },
        },
        _count: { select: { sessions: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Sessions per month (last 6 months)
  const now = new Date();
  const monthsData: { month: string; sesiones: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
    const count = allSessions.filter((s) => {
      const sd = new Date(s.date);
      return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth();
    }).length;
    monthsData.push({ month: label, sesiones: count });
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-[#022448] tracking-tight mb-2">Estadísticas</h1>
        <p className="text-[#43474e]">Análisis detallado del programa de mentoría.</p>
      </div>

      {/* Sessions per month */}
      <Card>
        <CardHeader>
          <CardTitle>Sesiones por mes (últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionsBarChart data={monthsData} />
        </CardContent>
      </Card>

      {/* Per-student metrics + curriculum progress */}
      <div>
        <h2 className="text-xl font-bold text-[#022448] mb-4">Progreso por alumno</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {students.map((student) => {
            const evals = student.sessions
              .map((s) => s.evaluation)
              .filter(Boolean) as NonNullable<(typeof student.sessions)[0]["evaluation"]>[];

            const metrics = {
              discipline: avg(evals.map((e) => e.discipline)),
              responsibility: avg(evals.map((e) => e.responsibility)),
              study: avg(evals.map((e) => e.study)),
              relationships: avg(evals.map((e) => e.relationships)),
              family: avg(evals.map((e) => e.family)),
              piety: avg(evals.map((e) => e.piety)),
            };

            const completedTopics = new Set(student.sessions.map((s) => s.formationTopic)).size;
            const progressPct = Math.round((completedTopics / TOTAL_TOPICS) * 100);

            return (
              <Card key={student.id} className="overflow-hidden">
                <CardHeader className="pb-2 bg-[#f4f3f7]/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{student.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tutor: {student.mentor?.name ?? "Sin asignar"}
                      </p>
                    </div>
                    <Link
                      href={`/estudiantes/${student.id}`}
                      className="text-[10px] font-bold uppercase tracking-widest text-[#795900] hover:underline"
                    >
                      Ver perfil
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Curriculum progress */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1">
                      <span>Progreso del currículum</span>
                      <span className="text-[#022448] font-bold">
                        {completedTopics}/{TOTAL_TOPICS} temas ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#e9e7eb] rounded-full h-2">
                      <div
                        className="bg-[#1e3a5f] h-2 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Radar chart */}
                  {evals.length > 0 ? (
                    <MetricsRadarChart metrics={metrics} />
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Sin evaluaciones registradas
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Mentor activity table */}
      <div>
        <h2 className="text-xl font-bold text-[#022448] mb-4">Actividad de tutores</h2>
        <div className="grid grid-cols-1 gap-4">
          {mentorActivity.map((m) => {
            const lastSession = m.sessions[0];
            const hours = m._count.sessions * HOURS_PER_SESSION;
            const allMentorSessions = lastSession
              ? [{ date: new Date(lastSession.date).toLocaleDateString("es-ES"), studentName: lastSession.student?.name ?? "—", topic: lastSession.formationTopic }]
              : [];
            // We need full session list for export — fetch inline via a separate query isn't possible here.
            // Export buttons will work with whatever data is passed (full list from profile page is better).
            return (
              <div
                key={m.id}
                className="bg-white rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <Link
                    href={`/mentores/${m.id}`}
                    className="font-bold text-[#1e3a5f] hover:underline"
                  >
                    {m.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Último tema:{" "}
                    <span className="font-medium text-[#1a1c1e]">
                      {lastSession ? lastSession.formationTopic : "—"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-extrabold text-[#795900]">{hours}h</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Acumuladas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-extrabold text-[#1e3a5f]">{m._count.sessions}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Sesiones</p>
                  </div>
                  <Link
                    href={`/mentores/${m.id}`}
                    className="text-xs font-bold text-[#795900] hover:underline hidden sm:block"
                  >
                    Ver reporte →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
