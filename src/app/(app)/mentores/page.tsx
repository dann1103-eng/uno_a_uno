import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function MentoresPage() {
  await requireRole("SUPERVISOR");

  const mentors = await prisma.user.findMany({
    where: { role: "MENTOR" },
    include: {
      students: { select: { id: true, name: true } },
      sessions: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mentores</h1>
        <p className="text-muted-foreground">{mentors.length} mentores en el programa</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentor</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Estudiante asignado</TableHead>
                <TableHead>Sesiones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mentors.map((mentor) => (
                <TableRow key={mentor.id}>
                  <TableCell className="font-medium">
                    <Link href={`/mentores/${mentor.id}`} className="text-primary hover:underline">
                      {mentor.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{mentor.email}</TableCell>
                  <TableCell>
                    {mentor.students.length === 0 ? (
                      <Badge variant="outline">Sin estudiante</Badge>
                    ) : mentor.students.length === 1 ? (
                      <Link
                        href={`/estudiantes/${mentor.students[0].id}`}
                        className="text-primary hover:underline"
                      >
                        {mentor.students[0].name}
                      </Link>
                    ) : (
                      <Badge variant="secondary">
                        {mentor.students.length} alumnos
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{mentor.sessions.length}</TableCell>
                </TableRow>
              ))}
              {mentors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No hay mentores registrados.
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
