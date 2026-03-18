"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { createSession } from "@/app/(app)/sesiones/actions";

type Topic = { id: string; title: string; weekNumber: number };

const metricFields = [
  { key: "discipline", label: "Disciplina" },
  { key: "responsibility", label: "Responsabilidad" },
  { key: "study", label: "Estudio" },
  { key: "relationships", label: "Relaciones" },
  { key: "balance", label: "Equilibrio" },
] as const;

type MetricKey = (typeof metricFields)[number]["key"];

export function SessionForm({ topics }: { topics: Topic[] }) {
  const [scores, setScores] = useState<Record<MetricKey, number>>({
    discipline: 3,
    responsibility: 3,
    study: 3,
    relationships: 3,
    balance: 3,
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    for (const [key, value] of Object.entries(scores)) {
      formData.set(key, String(value));
    }
    await createSession(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la sesión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="formationTopic">Tema de formación</Label>
            {topics.length > 0 ? (
              <Select name="formationTopic" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tema" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.title}>
                      Semana {t.weekNumber} — {t.title}
                    </SelectItem>
                  ))}
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="formationTopic"
                name="formationTopic"
                placeholder="Tema tratado en la sesión"
                required
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={4}
              placeholder="Resumen de la sesión..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextSteps">Próximos pasos</Label>
            <Textarea
              id="nextSteps"
              name="nextSteps"
              rows={3}
              placeholder="Compromisos y próximas acciones..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evaluación del estudiante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {metricFields.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>{label}</Label>
                <span className="text-sm font-medium w-6 text-center">
                  {scores[key]}
                </span>
              </div>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[scores[key]]}
                onValueChange={(v: number | readonly number[]) =>
                  setScores((s) => ({ ...s, [key]: Array.isArray(v) ? (v as readonly number[])[0] : (v as number) }))
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 — Bajo</span>
                <span>5 — Excelente</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Guardando..." : "Guardar sesión"}
      </Button>
    </form>
  );
}
