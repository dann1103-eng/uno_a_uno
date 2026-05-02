import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function MiEstudiantePage() {
  const user = await getCurrentUser();

  if (user.role !== "MENTOR") redirect("/dashboard");

  const student = await prisma.student.findFirst({
    where: { mentorId: user.id },
    orderBy: { name: "asc" },
  });

  if (!student) redirect("/dashboard");

  redirect(`/dashboard?alumno=${student.id}`);
}
