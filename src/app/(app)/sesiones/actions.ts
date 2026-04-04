"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const ALLOWED_ROLES = ["MENTOR", "SUPERVISOR", "SUBSTITUTE"];

export async function createSession(formData: FormData): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role ?? "")) {
    redirect("/login");
  }

  const userId = session.user.id;
  const userRole = session.user.role;
  const studentId = formData.get("studentId") as string;

  if (!studentId) return { error: "Debes seleccionar un alumno." };

  let student;

  if (userRole === "MENTOR") {
    student = await prisma.student.findFirst({
      where: { id: studentId, mentorId: userId },
    });
    if (!student) return { error: "El alumno seleccionado no te pertenece." };
  } else {
    student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return { error: "El alumno seleccionado no existe." };
  }

  const date = formData.get("date") as string;
  const formationTopic = formData.get("formationTopic") as string;
  const notes = (formData.get("notes") as string) ?? "";
  const nextSteps = (formData.get("nextSteps") as string) ?? "";

  const existingSession = await prisma.session.findFirst({
    where: { studentId: student.id, formationTopic },
  });
  if (existingSession) {
    return { error: "Ya existe una sesión registrada con este tema para este estudiante." };
  }

  const discipline = parseInt(formData.get("discipline") as string);
  const responsibility = parseInt(formData.get("responsibility") as string);
  const study = parseInt(formData.get("study") as string);
  const relationships = parseInt(formData.get("relationships") as string);
  const family = parseInt(formData.get("family") as string);
  const piety = parseInt(formData.get("piety") as string);

  await prisma.session.create({
    data: {
      studentId: student.id,
      mentorId: userId,
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
          family,
          piety,
        },
      },
    },
  });

  redirect(`/estudiantes/${student.id}`);
}
