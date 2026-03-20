import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/lib/button-variants";
import Link from "next/link";
import { BookOpen, PlusCircle, User, Calendar, Users, GraduationCap, HandHelping, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROGRAMMING_TOPICS } from "@/lib/programming-topics";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (user.role === "SUPERVISOR") {
    return <SupervisorDashboard />;
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
        include: { evaluation: true },
      },
    },
  });

  const student = students[0] ?? null;

  const sessionCount = student
    ? await prisma.session.count({ where: { studentId: student.id } })
    : 0;

  const lastSession = student?.sessions[0];
  const nextTopic = PROGRAMMING_TOPICS[sessionCount] ?? PROGRAMMING_TOPICS[0];

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#022448] p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <HandHelping className="h-6 w-6 text-[#eec058]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#eec058]">
            Mentores Uno a Uno
          </span>
        </div>
        <h1 className="text-2xl font-bold mt-2">
          Bienvenido, {userName.split(" ")[0]}
        </h1>
        <p className="text-sm text-white/70 mt-1">
          Panel de mentoría personal
        </p>
      </div>

      {!student ? (
        <Card className="border-none shadow-[0_12px_32px_rgba(2,36,72,0.06)]">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-muted-foreground">No tienes un estudiante asignado aún. Contacta a tu supervisor.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Student card */}
          <Card className="md:col-span-2 border-none shadow-[0_12px_32px_rgba(2,36,72,0.06)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1e3a5f]">
                <User className="h-5 w-5" />
                Tu Estudiante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-[#022448]">{student.name}</p>
                <p className="text-muted-foreground">
                  {student.age} años · {student.grade}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/estudiantes/${student.id}`}
                  className={cn(buttonVariants({ size: "sm" }), "bg-[#1e3a5f] hover:bg-[#022448]")}
                >
                  <User className="h-4 w-4 mr-1" />
                  Ver perfil
                </Link>
                <Link
                  href="/sesiones/nueva"
                  className={cn(buttonVariants({ size: "sm" }), "bg-[#d4a843] hover:bg-[#c09935] text-[#261a00]")}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Nueva sesión
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Session count */}
          <Card className="border-none shadow-[0_12px_32px_rgba(2,36,72,0.06)]">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Sesiones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-[#1e3a5f]">{sessionCount}</p>
              <p className="text-sm text-muted-foreground mt-1">sesiones registradas</p>
            </CardContent>
          </Card>

          {/* Last session */}
          {lastSession && (
            <Card className="md:col-span-2 border-none shadow-[0_12px_32px_rgba(2,36,72,0.06)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-[#1e3a5f]">
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
              <CardContent className="space-y-3">
                <Badge className="bg-[#1e3a5f]/10 text-[#1e3a5f] hover:bg-[#1e3a5f]/15">
                  {lastSession.formationTopic}
                </Badge>
                {lastSession.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {lastSession.notes}
                  </p>
                )}
                {lastSession.nextSteps && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Próximos pasos
                    </p>
                    <p className="text-sm line-clamp-2 mt-0.5">{lastSession.nextSteps}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Next topic */}
          {nextTopic && (
            <Card className="border-none shadow-[0_12px_32px_rgba(2,36,72,0.06)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-[#1e3a5f]">
                  <BookOpen className="h-4 w-4" />
                  Próximo Tema
                </CardTitle>
                <CardDescription>Tema {nextTopic.number}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium text-sm">{nextTopic.title}</p>
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
  const mentorsWithoutStudent = mentors.filter((m) => !m.student);

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#022448] p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <HandHelping className="h-6 w-6 text-[#eec058]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#eec058]">
            Mentores Uno a Uno
          </span>
        </div>
        <h1 className="text-2xl font-bold mt-2">Dashboard Supervisor</h1>
        <p className="text-sm text-white/70 mt-1">
          Vista general del programa de mentoría
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-[0_12px_32px_rgba(2,36,72,0.06)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Mentores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[#1e3a5f]">{mentors.length}</p>
            {mentorsWithoutStudent.length > 0 && (
              <p className="text-xs text-[#d4a843] font-medium mt-1">
                {mentorsWithoutStudent.length} sin alumno asignado
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-none shadow-[0_12px_32px_rgba(2,36,72,0.06)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Estudiantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[#1e3a5f]">{students.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-[0_12px_32px_rgba(2,36,72,0.06)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Sesiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[#1e3a5f]">{sessionCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Mentors without student alert */}
      {mentorsWithoutStudent.length > 0 && (
        <Card className="border-none shadow-[0_12px_32px_rgba(2,36,72,0.06)] bg-[#eec058]/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-[#5b4300]">
              <AlertCircle className="h-4 w-4 text-[#d4a843]" />
              Mentores sin alumno asignado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mentorsWithoutStudent.map((m) => (
                <Badge key={m.id} className="bg-[#d4a843]/15 text-[#5b4300] hover:bg-[#d4a843]/25">
                  {m.name}
                </Badge>
              ))}
            </div>
            <Link
              href="/admin"
              className={cn(buttonVariants({ size: "sm" }), "mt-3 bg-[#d4a843] hover:bg-[#c09935] text-[#261a00]")}
            >
              Gestionar alumnos
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent sessions */}
      <Card className="border-none shadow-[0_12px_32px_rgba(2,36,72,0.06)]">
        <CardHeader>
          <CardTitle className="text-[#1e3a5f]">Sesiones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Fecha</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Estudiante</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Mentor</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Tema</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSessions.map((session) => (
                <TableRow key={session.id} className="hover:bg-[#d5e3ff]/20">
                  <TableCell className="text-sm">
                    {new Date(session.date).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell className="font-medium">{session.student.name}</TableCell>
                  <TableCell>{session.mentor.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
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
