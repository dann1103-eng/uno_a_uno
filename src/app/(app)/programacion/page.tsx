import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";

export default async function ProgramacionPage() {
  await getCurrentUser();

  const topics = await prisma.programmingTopic.findMany({
    orderBy: { weekNumber: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Programación</h1>
        <p className="text-muted-foreground">
          Guía estructurada de temas para las sesiones de mentoría
        </p>
      </div>

      <div className="grid gap-3">
        {topics.map((topic) => (
          <Link key={topic.id} href={`/programacion/${topic.id}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Semana {topic.weekNumber}
                        </Badge>
                      </div>
                      <CardTitle className="text-base mt-1">{topic.title}</CardTitle>
                      <CardDescription className="line-clamp-1 mt-0.5">
                        {topic.description}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}

        {topics.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No hay temas de programación disponibles aún.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
