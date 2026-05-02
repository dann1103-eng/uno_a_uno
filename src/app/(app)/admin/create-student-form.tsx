"use client";

import { useState } from "react";
import { createStudent } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap } from "lucide-react";

type Mentor = { id: string; name: string; studentCount: number };

export function CreateStudentForm({ mentors }: { mentors: Mentor[] }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mentorId, setMentorId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("mentorId", mentorId === "none" ? "" : mentorId);

    try {
      await createStudent(formData);
      setSuccess("Alumno creado correctamente.");
      (e.target as HTMLFormElement).reset();
      setMentorId("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear el alumno.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4" />
          Crear nuevo alumno
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Nombre completo</Label>
              <Input id="studentName" name="name" placeholder="Juan Pérez" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Edad</Label>
              <Input id="age" name="age" type="number" min="5" max="25" placeholder="12" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grado escolar</Label>
              <Input id="grade" name="grade" placeholder="6to Primaria" required />
            </div>
            <div className="space-y-2">
              <Label>Mentor asignado</Label>
              <Select value={mentorId} onValueChange={(v) => setMentorId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {mentors.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}{m.studentCount > 0 ? ` (${m.studentCount} ${m.studentCount === 1 ? "alumno" : "alumnos"})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? "Creando..." : "Crear alumno"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
