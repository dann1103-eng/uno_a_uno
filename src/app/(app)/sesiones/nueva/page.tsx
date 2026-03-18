import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionForm } from "@/components/session-form";

export default async function NuevaSesionPage() {
  const user = await getCurrentUser();

  if (user.role !== "MENTOR") redirect("/dashboard");

  const student = await prisma.student.findUnique({
    where: { mentorId: user.id },
  });

  if (!student) redirect("/dashboard");

  const topics = await prisma.programmingTopic.findMany({
    orderBy: { weekNumber: "asc" },
    select: { id: true, title: true, weekNumber: true },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Nueva Sesión</h1>
        <p className="text-muted-foreground">
          Registra la sesión con{" "}
          <span className="font-medium text-foreground">{student.name}</span>
        </p>
      </div>
      <SessionForm topics={topics} />
    </div>
  );
}
