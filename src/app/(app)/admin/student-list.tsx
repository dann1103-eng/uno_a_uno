"use client";

import { useState } from "react";
import { reassignStudent, unassignStudent } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

type Student = {
  id: string;
  name: string;
  age: number;
  grade: string;
  mentor: { id: string; name: string } | null;
};

type Mentor = { id: string; name: string; hasStudent: boolean };

export function StudentList({ students, mentors }: { students: Student[]; mentors: Mentor[] }) {
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [newMentorId, setNewMentorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const availableMentors = mentors.filter((m) => !m.hasStudent);

  async function handleReassign(studentId: string) {
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData();
    formData.set("studentId", studentId);
    formData.set("newMentorId", newMentorId);

    try {
      await reassignStudent(formData);
      setSuccess("Alumno reasignado correctamente.");
      setReassigning(null);
      setNewMentorId("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al reasignar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnassign(studentId: string) {
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData();
    formData.set("studentId", studentId);

    try {
      await unassignStudent(formData);
      setSuccess("Alumno desasignado correctamente.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al desasignar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Alumnos registrados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        {students.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay alumnos registrados.</p>
        )}

        {students.map((student) => (
          <div
            key={student.id}
            className="flex items-center justify-between py-3 border-b last:border-0"
          >
            <div>
              <p className="text-sm font-medium">{student.name}</p>
              <p className="text-xs text-muted-foreground">
                {student.age} años · {student.grade}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {reassigning === student.id ? (
                <div className="flex items-center gap-2">
                  <Select value={newMentorId} onValueChange={(v) => { if (v) setNewMentorId(v); }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Nuevo mentor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMentors.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    disabled={loading || !newMentorId}
                    onClick={() => handleReassign(student.id)}
                  >
                    {loading ? "..." : "Guardar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setReassigning(null); setNewMentorId(""); }}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {student.mentor ? (
                    <Badge variant="secondary">{student.mentor.name}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      Sin mentor
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReassigning(student.id)}
                  >
                    {student.mentor ? "Reasignar" : "Asignar"}
                  </Button>
                  {student.mentor && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={loading}
                      onClick={() => handleUnassign(student.id)}
                    >
                      Desasignar
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
