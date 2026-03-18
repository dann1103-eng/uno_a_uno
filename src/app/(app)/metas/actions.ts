"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createGoal(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "MENTOR") redirect("/login");

  const studentId = formData.get("studentId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  await prisma.goal.create({
    data: {
      studentId,
      title,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  revalidatePath(`/estudiantes/${studentId}`);
}

export async function addGoalUpdate(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "MENTOR") redirect("/login");

  const goalId = formData.get("goalId") as string;
  const progressNote = formData.get("progressNote") as string;

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: { studentId: true },
  });

  await prisma.goalUpdate.create({
    data: { goalId, progressNote },
  });

  if (goal) revalidatePath(`/estudiantes/${goal.studentId}`);
}

export async function completeGoal(goalId: string, studentId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "MENTOR") redirect("/login");

  await prisma.goal.update({
    where: { id: goalId },
    data: { status: "COMPLETED" },
  });

  revalidatePath(`/estudiantes/${studentId}`);
}
