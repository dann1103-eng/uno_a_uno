import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MentorExportButtons } from "@/components/mentor-export-buttons";
import Link from "next/link";
import { ArrowLeft, Mail, User } from "lucide-react";

const HOURS_PER_SESSION = 3;

export default async function MentorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("SUPERVISOR");
  const { id } = await params;

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

  if (!mentor || mentor.role !== "MENTOR") notFound();

  const totalHours = mentor.sessions.length * HOURS_PER_SESSION;

  const sessionRows = mentor.sessions.map((s) => ({
    date: new Date(s.date).toLocaleDateString("es-ES"),
    studentName: s.student.name,
    topic: s.formationTopic,
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/mentores"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Mentores
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-[#022448]">{mentor.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            {mentor.email}
          </div>
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
        </div>
        <MentorExportButtons mentorName={mentor.name ?? "tutor"} sessions={sessionRows} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Sesiones
          </p>
          <p className="text-4xl font-extrabold text-[#1e3a5f]">{mentor.sessions.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Horas acumuladas
          </p>
          <p className="text-4xl font-extrabold text-[#795900]">{totalHours}h</p>
        </div>
        <div className="bg-white rounded-xl border p-5 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Último tema
          </p>
          <p className="text-sm font-semibold text-[#1e3a5f] leading-tight">
            {mentor.sessions.length > 0
              ? mentor.sessions[mentor.sessions.length - 1].formationTopic
              : "—"}
          </p>
        </div>
      </div>

      {/* Sessions table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Registro de sesiones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Alumno</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead className="text-right">Horas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mentor.sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(session.date).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell className="font-medium">{session.student.name}</TableCell>
                  <TableCell className="text-sm">{session.formationTopic}</TableCell>
                  <TableCell className="text-right font-medium">{HOURS_PER_SESSION}h</TableCell>
                </TableRow>
              ))}
              {mentor.sessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Este tutor aún no tiene sesiones registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {mentor.sessions.length > 0 && (
            <div className="px-4 py-3 border-t bg-[#fece65]/20 flex justify-end">
              <span className="text-sm font-bold text-[#795900]">
                Total: {totalHours} horas acumuladas
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
