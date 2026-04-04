import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/button-variants";
import { MetricsRadarChart } from "@/components/metrics-radar-chart";
import Link from "next/link";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { AddGoalDialog } from "@/components/add-goal-dialog";
import { AddGoalUpdateDialog } from "@/components/add-goal-update-dialog";
import { cn } from "@/lib/utils";

function calcAvg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      mentor: true,
      sessions: {
        orderBy: { date: "desc" },
        include: {
          evaluation: true,
          mentor: { select: { id: true, name: true, role: true } },
        },
      },
      goals: {
        orderBy: { startDate: "desc" },
        include: { updates: { orderBy: { date: "desc" } } },
      },
    },
  });

  if (!student) notFound();

  if (user.role === "MENTOR" && student.mentorId !== user.id) notFound();

  const last5 = student.sessions.slice(0, 5).map((s) => s.evaluation).filter(Boolean);

  const metrics = {
    discipline: calcAvg(last5.map((e) => e!.discipline)),
    responsibility: calcAvg(last5.map((e) => e!.responsibility)),
    study: calcAvg(last5.map((e) => e!.study)),
    relationships: calcAvg(last5.map((e) => e!.relationships)),
    family: calcAvg(last5.map((e) => e!.family)),
    piety: calcAvg(last5.map((e) => e!.piety)),
  };

  const hasMetrics = last5.length > 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{student.name}</h1>
          <p className="text-muted-foreground">
            {student.age} años · {student.grade}
          </p>
        </div>
        {(user.role === "MENTOR" || user.role === "SUBSTITUTE" || user.role === "SUPERVISOR") && (
          <Link
            href="/sesiones/nueva"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Nueva sesión
          </Link>
        )}
      </div>

      <Tabs defaultValue="informacion">
        <TabsList>
          <TabsTrigger value="informacion">Información</TabsTrigger>
          <TabsTrigger value="sesiones">Sesiones ({student.sessions.length})</TabsTrigger>
          <TabsTrigger value="metas">Metas ({student.goals.length})</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="informacion" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Nombre</p>
                  <p className="font-medium">{student.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Edad</p>
                  <p className="font-medium">{student.age} años</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Grado</p>
                  <p className="font-medium">{student.grade}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Mentor</p>
                  <p className="font-medium">{student.mentor?.name ?? "Sin mentor asignado"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Sesiones totales</p>
                  <p className="font-medium">{student.sessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sesiones" className="mt-4 space-y-3">
          {student.sessions.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No hay sesiones registradas aún.
              </CardContent>
            </Card>
          )}
          {student.sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {session.formationTopic}
                    </CardTitle>
                    {session.mentor && session.mentor.id !== student.mentorId && (
                      <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                        Por: {session.mentor.name} ({session.mentor.role === "SUBSTITUTE" ? "Suplente" : "Supervisor"})
                      </p>
                    )}
                    {!session.mentor && (
                      <p className="text-xs text-muted-foreground mt-0.5">Por: Mentor eliminado</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(session.date).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {session.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Notas</p>
                    <p className="text-sm whitespace-pre-line">{session.notes}</p>
                  </div>
                )}
                {session.nextSteps && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Próximos pasos</p>
                    <p className="text-sm whitespace-pre-line">{session.nextSteps}</p>
                  </div>
                )}
                {session.evaluation && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(
                      [
                        ["Disciplina", session.evaluation.discipline],
                        ["Responsabilidad", session.evaluation.responsibility],
                        ["Estudio", session.evaluation.study],
                        ["Relaciones", session.evaluation.relationships],
                        ["Familia", session.evaluation.family],
                        ["Piedad", session.evaluation.piety],
                      ] as [string, number][]
                    ).map(([label, value]) => (
                      <Badge key={label} variant="secondary" className="text-xs">
                        {label}: {value}/5
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="metas" className="mt-4 space-y-3">
          {user.role === "MENTOR" && (
            <AddGoalDialog studentId={student.id} />
          )}
          {student.goals.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No hay metas registradas aún.
              </CardContent>
            </Card>
          )}
          {student.goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{goal.title}</CardTitle>
                  <Badge variant={goal.status === "COMPLETED" ? "default" : "secondary"}>
                    {goal.status === "COMPLETED" ? "Completada" : "Activa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {goal.description && (
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                )}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Inicio: {new Date(goal.startDate).toLocaleDateString("es-ES")}</span>
                  {goal.endDate && (
                    <span>Fin: {new Date(goal.endDate).toLocaleDateString("es-ES")}</span>
                  )}
                </div>
                {goal.updates.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Actualizaciones
                    </p>
                    {goal.updates.map((update) => (
                      <div key={update.id} className="border-l-2 pl-3 space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          {new Date(update.date).toLocaleDateString("es-ES")}
                        </p>
                        <p className="text-sm">{update.progressNote}</p>
                      </div>
                    ))}
                  </div>
                )}
                {user.role === "MENTOR" && goal.status === "ACTIVE" && (
                  <AddGoalUpdateDialog goalId={goal.id} />
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="metricas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Desarrollo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Promedio de las últimas {Math.min(last5.length, 5)} sesiones
              </p>
            </CardHeader>
            <CardContent>
              {!hasMetrics ? (
                <p className="text-muted-foreground text-sm">
                  No hay evaluaciones registradas aún.
                </p>
              ) : (
                <div className="space-y-4">
                  <MetricsRadarChart metrics={metrics} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {(
                      [
                        ["Disciplina", metrics.discipline],
                        ["Responsabilidad", metrics.responsibility],
                        ["Estudio", metrics.study],
                        ["Relaciones", metrics.relationships],
                        ["Familia", metrics.family],
                        ["Piedad", metrics.piety],
                      ] as [string, number][]
                    ).map(([label, value]) => (
                      <div key={label} className="text-center p-3 rounded-lg bg-muted">
                        <p className="text-2xl font-bold">{value.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
