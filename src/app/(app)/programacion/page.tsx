import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, HandHelping, Check } from "lucide-react";
import { PROGRAMMING_TOPICS } from "@/lib/programming-topics";

export default async function ProgramacionPage() {
  const user = await getCurrentUser();

  // For mentors, fetch their student's completed sessions
  let completedTopics = new Map<string, { notes: string; date: Date }>();
  if (user.role === "MENTOR") {
    const student = await prisma.student.findFirst({
      where: { mentorId: user.id },
      include: {
        sessions: {
          select: { formationTopic: true, notes: true, date: true },
        },
      },
    });
    if (student) {
      for (const session of student.sessions) {
        completedTopics.set(session.formationTopic, {
          notes: session.notes,
          date: session.date,
        });
      }
    }
  }

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
        {PROGRAMMING_TOPICS.map((item, index) => {
          if (item.type === "break") {
            return (
              <div
                key={`break-${index}`}
                className="flex items-center gap-4 py-3 px-4"
              >
                <div className="flex-1 h-px bg-[#eec058]/30" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#5b4300] bg-[#ffdf9f]/40 px-4 py-1.5 rounded-full">
                  {item.label}
                </span>
                <div className="flex-1 h-px bg-[#eec058]/30" />
              </div>
            );
          }

          const completed = completedTopics.get(item.title);
          const isCompleted = !!completed;

          return (
            <Card
              key={item.number}
              className={`border-none transition-shadow ${
                isCompleted
                  ? "shadow-[0_4px_16px_rgba(2,36,72,0.04)] bg-[#1e3a5f]/5 border-l-4 border-l-[#1e3a5f]"
                  : "shadow-[0_4px_16px_rgba(2,36,72,0.04)] hover:shadow-[0_8px_24px_rgba(2,36,72,0.08)]"
              }`}
            >
              <CardHeader className="py-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shrink-0 ${
                      isCompleted
                        ? "bg-[#1e3a5f] text-white"
                        : "bg-[#1e3a5f]/10 text-[#1e3a5f]"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      item.number
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase tracking-wider ${
                          isCompleted ? "border-[#1e3a5f]/30 text-[#1e3a5f]" : ""
                        }`}
                      >
                        Tema {item.number}
                      </Badge>
                      {isCompleted && (
                        <Badge className="bg-[#1e3a5f]/10 text-[#1e3a5f] hover:bg-[#1e3a5f]/15 text-[10px]">
                          Completado
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm font-semibold text-[#022448]">
                      {item.title}
                    </CardTitle>
                    {isCompleted && completed.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                        {completed.notes}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
