"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function createSession(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "MENTOR") redirect("/login");

  const mentorId = session.user.id;

  const student = await prisma.student.findUnique({
    where: { mentorId },
  });

  if (!student) throw new Error("No tienes un estudiante asignado.");

  const date = formData.get("date") as string;
  const formationTopic = formData.get("formationTopic") as string;
  const notes = (formData.get("notes") as string) ?? "";
  const nextSteps = (formData.get("nextSteps") as string) ?? "";

  const discipline = parseInt(formData.get("discipline") as string);
  const responsibility = parseInt(formData.get("responsibility") as string);
  const study = parseInt(formData.get("study") as string);
  const relationships = parseInt(formData.get("relationships") as string);
  const balance = parseInt(formData.get("balance") as string);

  const newSession = await prisma.session.create({
    data: {
      studentId: student.id,
      mentorId,
      date: new Date(date),
      formationTopic,
      notes,
      nextSteps,
      evaluation: {
        create: {
          discipline,
          responsibility,
          study,
          relationships,
          balance,
        },
      },
    },
  });

  redirect(`/estudiantes/${student.id}`);
}
