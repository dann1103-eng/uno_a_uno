import { getCurrentUser } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/button-variants";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROGRAMMING_TOPICS } from "@/lib/programming-topics";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getCurrentUser();
  const { id } = await params;

  const topicNumber = parseInt(id);
  const topic = PROGRAMMING_TOPICS.find((t) => t.number === topicNumber);

  if (!topic) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/programacion"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Link>
      </div>

      <div className="space-y-1">
        <Badge variant="outline">Tema {topic.number}</Badge>
        <h1 className="text-2xl font-bold">{topic.title}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Tema de Formación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{topic.title}</p>
        </CardContent>
      </Card>
    </div>
  );
}
