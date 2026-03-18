import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

function avgMetric(evals: { discipline: number; responsibility: number; study: number; relationships: number; balance: number }[]) {
  if (!evals.length) return null;
  const sum = evals.reduce((acc, e) => acc + (e.discipline + e.responsibility + e.study + e.relationships + e.balance) / 5, 0);
  return (sum / evals.length).toFixed(1);
}

export default async function EstudiantesPage() {
  await requireRole("SUPERVISOR");

  const students = await prisma.student.findMany({
    include: {
      mentor: true,
      sessions: {
        include: { evaluation: true },
        orderBy: { date: "desc" },
        take: 5,
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estudiantes</h1>
        <p className="text-muted-foreground">{students.length} estudiantes en el programa</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Grado</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Sesiones</TableHead>
                <TableHead>Promedio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const evals = student.sessions
                  .map((s) => s.evaluation)
                  .filter(Boolean) as { discipline: number; responsibility: number; study: number; relationships: number; balance: number }[];
                const avg = avgMetric(evals);
                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Link
                        href={`/estudiantes/${student.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {student.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{student.grade}</TableCell>
                    <TableCell>{student.mentor.name}</TableCell>
                    <TableCell>{student.sessions.length}</TableCell>
                    <TableCell>{avg ? `${avg}/5` : "—"}</TableCell>
                  </TableRow>
                );
              })}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hay estudiantes registrados.
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
