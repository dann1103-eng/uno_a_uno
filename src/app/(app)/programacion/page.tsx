import { getCurrentUser } from "@/lib/auth-utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, HandHelping } from "lucide-react";
import { PROGRAMMING_TOPICS } from "@/lib/programming-topics";

export default async function ProgramacionPage() {
  await getCurrentUser();

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#022448] p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="h-6 w-6 text-[#eec058]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#eec058]">
            Guía de Formación
          </span>
        </div>
        <h1 className="text-2xl font-bold mt-2">Programación</h1>
        <p className="text-sm text-white/70 mt-1">
          Temas estructurados para las sesiones de mentoría
        </p>
      </div>

      <div className="grid gap-3">
        {PROGRAMMING_TOPICS.map((topic) => (
          <Card
            key={topic.number}
            className="border-none shadow-[0_4px_16px_rgba(2,36,72,0.04)] hover:shadow-[0_8px_24px_rgba(2,36,72,0.08)] transition-shadow"
          >
            <CardHeader className="py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e3a5f]/10 text-[#1e3a5f] font-bold text-sm shrink-0">
                  {topic.number}
                </div>
                <div>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider mb-1">
                    Tema {topic.number}
                  </Badge>
                  <CardTitle className="text-sm font-semibold text-[#022448]">
                    {topic.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
