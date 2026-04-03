"use client";

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { createSession } from "@/app/(app)/sesiones/actions";
import { Lightbulb } from "lucide-react";

type Topic = { id: string; title: string; weekNumber: number };
type Student = { id: string; name: string };

const metricFields = [
  { key: "discipline", label: "Disciplina" },
  { key: "responsibility", label: "Responsabilidad" },
  { key: "study", label: "Estudio" },
  { key: "relationships", label: "Relaciones" },
  { key: "family", label: "Familia" },
  { key: "piety", label: "Piedad" },
] as const;

type MetricKey = (typeof metricFields)[number]["key"];

const tips = [
  "Recuerda que la formación en virtudes es un proceso gradual. Enfócate en una meta pequeña para la próxima semana.",
  "Escucha antes de aconsejar. La confianza se construye con presencia y paciencia.",
  "Celebra los pequeños logros. El reconocimiento motiva más que la corrección.",
];

export function SessionForm({ topics, students }: { topics: Topic[]; students: Student[] }) {
  const [scores, setScores] = useState<Record<MetricKey, number>>({
    discipline: 3,
    responsibility: 3,
    study: 3,
    relationships: 3,
    family: 3,
    piety: 3,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState(
    students.length === 1 ? students[0].id : ""
  );
  const submittingRef = useRef(false);
  const tipIndex = Math.floor(Math.random() * tips.length);

  async function handleSubmit(formData: FormData) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError(null);

    for (const [key, value] of Object.entries(scores)) {
      formData.set(key, String(value));
    }
    formData.set("studentId", selectedStudent);

    try {
      const result = await createSession(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
        submittingRef.current = false;
      }
    } catch {
      // redirect throws NEXT_REDIRECT which is expected
    }
  }

  const studentName = students.find((s) => s.id === selectedStudent)?.name ?? "";

  return (
    <form id="session-form" action={handleSubmit}>
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Session Data */}
        <section className="lg:col-span-7 bg-white p-8 rounded-xl shadow-[0px_12px_32px_rgba(2,36,72,0.06)] space-y-8">
          <div className="flex items-center justify-between border-b border-[#c4c6cf]/15 pb-4">
            <h2 className="text-xl font-bold text-[#022448]">Datos de la sesión</h2>
            {selectedStudent && (
              <div className="flex items-center gap-2 bg-[#1e3a5f]/5 px-4 py-1.5 rounded-full border border-[#1e3a5f]/10">
                <span className="w-2 h-2 rounded-full bg-[#1e3a5f]"></span>
                <span className="text-xs font-bold text-[#022448] uppercase tracking-wider">
                  {studentName}
                </span>
              </div>
            )}
          </div>

          {students.length > 1 && (
            <div className="space-y-2">
              <Label className="block text-xs font-bold uppercase tracking-widest text-[#43474e] px-1">
                Alumno
              </Label>
              <Select
                value={selectedStudent}
                onValueChange={(v) => v && setSelectedStudent(v)}
                required
              >
                <SelectTrigger className="w-full bg-[#f4f3f7] border-none rounded-lg p-3 text-sm">
                  <SelectValue placeholder="Selecciona un alumno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="block text-xs font-bold uppercase tracking-widest text-[#43474e] px-1">
                Fecha de la Sesión
              </Label>
              <Input
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
                className="w-full bg-[#f4f3f7] border-none rounded-lg p-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="block text-xs font-bold uppercase tracking-widest text-[#43474e] px-1">
                Tema Principal
              </Label>
              {topics.length > 0 ? (
                <Select name="formationTopic" required>
                  <SelectTrigger className="w-full bg-[#f4f3f7] border-none rounded-lg p-3 text-sm">
                    <SelectValue placeholder="Seleccionar tema..." />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => (
                      <SelectItem key={t.id} value={t.title}>
                        {t.weekNumber}. {t.title}
                      </SelectItem>
                    ))}
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  name="formationTopic"
                  placeholder="Tema tratado en la sesión"
                  required
                  className="w-full bg-[#f4f3f7] border-none rounded-lg p-3 text-sm"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="block text-xs font-bold uppercase tracking-widest text-[#43474e] px-1">
              Notas de la sesión
            </Label>
            <Textarea
              name="notes"
              rows={4}
              placeholder="Describe los puntos clave discutidos..."
              className="w-full bg-[#f4f3f7] border-none rounded-lg p-4 text-sm resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="block text-xs font-bold uppercase tracking-widest text-[#43474e] px-1">
              Próximos pasos
            </Label>
            <Textarea
              name="nextSteps"
              rows={3}
              placeholder="Tareas o compromisos para la siguiente sesión..."
              className="w-full bg-[#f4f3f7] border-none rounded-lg p-4 text-sm resize-none"
            />
          </div>
        </section>

        {/* Right Column: Evaluation + Tip */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-xl shadow-[0px_12px_32px_rgba(2,36,72,0.06)] space-y-8">
            <div className="border-b border-[#c4c6cf]/15 pb-4">
              <h2 className="text-xl font-bold text-[#022448]">Evaluación del estudiante</h2>
            </div>

            <div className="space-y-6">
              {metricFields.map(({ key, label }) => (
                <div key={key} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[#1a1c1e]">{label}</span>
                    <span className="text-xs font-black text-[#c89d39] bg-[#ffdf9f]/30 px-2 py-0.5 rounded">
                      {scores[key]}/5
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
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter text-[#43474e] opacity-60">
                    <span>Bajo</span>
                    <span>Excelente</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tip Card */}
          <div className="bg-[#1e3a5f] rounded-xl p-6 text-white overflow-hidden relative group">
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-2">Consejo de Mentoría</h4>
              <p className="text-sm text-[#8aa4cf] leading-relaxed">
                {tips[tipIndex]}
              </p>
            </div>
            <Lightbulb className="absolute -bottom-4 -right-4 h-20 w-20 opacity-10 rotate-12 transition-transform group-hover:scale-110 text-white" />
          </div>
        </section>
      </div>

      {/* Hidden submit button for form attribute usage from page header */}
      <button
        type="submit"
        id="session-form-submit"
        className="hidden"
        disabled={loading || !selectedStudent}
      />
    </form>
  );
}

export function SessionFormActions({ loading, disabled }: { loading: boolean; disabled: boolean }) {
  return null;
}
