import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { PROGRAMMING_TOPICS } from "@/lib/programming-topics";
import { TopicAccordionItem } from "@/components/topic-accordion-item";
import { StudentTabs } from "@/components/student-tabs";

export default async function ProgramacionPage({
  searchParams,
}: {
  searchParams: Promise<{ alumno?: string }>;
}) {
  const user = await getCurrentUser();
  const { alumno } = await searchParams;

  // Fetch topic content from DB
  const allContent = await prisma.topicContent.findMany();
  const contentMap = new Map(allContent.map((tc) => [tc.topicNumber, tc]));

  // For mentors, fetch all their students and resolve the active one
  let completedTopics = new Map<string, { notes: string; date: Date }>();
  let allStudents: { id: string; name: string }[] = [];
  let activeStudentId: string | undefined;

  if (user.role === "MENTOR") {
    const students = await prisma.student.findMany({
      where: { mentorId: user.id },
      orderBy: { name: "asc" },
      include: {
        sessions: {
          select: { formationTopic: true, notes: true, date: true },
        },
      },
    });

    allStudents = students.map((s) => ({ id: s.id, name: s.name }));
    const activeStudent =
      students.find((s) => s.id === alumno) ?? students[0] ?? null;
    activeStudentId = activeStudent?.id;

    if (activeStudent) {
      for (const session of activeStudent.sessions) {
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
        {user.role === "SUPERVISOR" && (
          <Badge className="mt-3 bg-[#eec058]/20 text-[#eec058] border-[#eec058]/30 text-[10px] uppercase tracking-wider">
            Modo edición
          </Badge>
        )}
      </div>

      {user.role === "MENTOR" && allStudents.length > 1 && activeStudentId && (
        <StudentTabs students={allStudents} activeId={activeStudentId} />
      )}

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

          const tc = contentMap.get(item.number);

          // Hide topics marked invisible from non-supervisors
          if (user.role !== "SUPERVISOR" && tc?.visible === false) {
            return null;
          }

          const completed = completedTopics.get(item.title);

          const topicContentProp = tc
            ? {
                content: tc.content,
                links: tc.links as { label: string; url: string }[],
                visible: tc.visible,
              }
            : null;

          return (
            <TopicAccordionItem
              key={item.number}
              topic={{ number: item.number, title: item.title }}
              topicContent={topicContentProp}
              completed={
                completed
                  ? { notes: completed.notes, date: completed.date.toISOString() }
                  : null
              }
              userRole={user.role!}
            />
          );
        })}
      </div>
    </div>
  );
}
