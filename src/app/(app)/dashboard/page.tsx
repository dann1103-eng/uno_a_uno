import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, PlusCircle, User, Calendar, Users, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (user.role === "SUPERVISOR") {
    return <SupervisorDashboard />;
  }

  return <MentorDashboard userId={user.id} />;
}

async function MentorDashboard({ userId }: { userId: string }) {
  const student = await prisma.student.findUnique({
    where: { mentorId: userId },
    include: {
      sessions: {
        orderBy: { date: "desc" },
        take: 1,
        include: { evaluation: true },
      },
    },
  });

  const nextTopic = await prisma.programmingTopic.findFirst({
    orderBy: { weekNumber: "asc" },
  });

  const sessionCount = student
    ? await prisma.session.count({ where: { studentId: student.id } })
    : 0;

  const lastSession = student?.sessions[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido a tu panel de mentoría</p>
      </div>

      {!student ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes un estudiante asignado aún.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Tu Estudiante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold">{student.name}</p>
                <p className="text-muted-foreground">
                  {student.age} años · {student.grade}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/estudiantes/${student.id}`}
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  <User className="h-4 w-4 mr-1" />
                  Ver perfil
                </Link>
                <Link
                  href="/sesiones/nueva"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Nueva sesión
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sesiones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{sessionCount}</p>
              <p className="text-sm text-muted-foreground">sesiones registradas</p>
            </CardContent>
          </Card>

          {lastSession && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Última Sesión
                </CardTitle>
                <CardDescription>
                  {new Date(lastSession.date).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{lastSession.formationTopic}</p>
                {lastSession.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {lastSession.notes}
                  </p>
                )}
                {lastSession.nextSteps && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Próximos pasos
                    </p>
                    <p className="text-sm line-clamp-2">{lastSession.nextSteps}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {nextTopic && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4" />
                  Próximo Tema
                </CardTitle>
                <CardDescription>Semana {nextTopic.weekNumber}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{nextTopic.title}</p>
                <Link
                  href="/programacion"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-full")}
                >
                  Ver programación
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

async function SupervisorDashboard() {
  const [mentors, students, recentSessions] = await Promise.all([
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
      include: { student: true, mentor: true },
    }),
  ]);

  const sessionCount = await prisma.session.count();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Supervisor</h1>
        <p className="text-muted-foreground">Vista general del programa de mentoría</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" /> Mentores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{mentors.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Estudiantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{students.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Sesiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{sessionCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sesiones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Estudiante</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Tema</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="text-sm">
                    {new Date(session.date).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell>{session.student.name}</TableCell>
                  <TableCell>{session.mentor.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {session.formationTopic}
                  </TableCell>
                </TableRow>
              ))}
              {recentSessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No hay sesiones registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
