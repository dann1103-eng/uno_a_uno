"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createUser(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "SUPERVISOR") {
    throw new Error("No autorizado");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "MENTOR" | "SUPERVISOR";

  if (!name || !email || !password || !role) {
    throw new Error("Todos los campos son obligatorios");
  }

  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Ya existe un usuario con ese correo");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, passwordHash, role },
  });

  revalidatePath("/admin");
}

export async function createStudent(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "SUPERVISOR") {
    throw new Error("No autorizado");
  }

  const name = formData.get("name") as string;
  const age = parseInt(formData.get("age") as string);
  const grade = formData.get("grade") as string;
  const mentorId = formData.get("mentorId") as string;

  if (!name || !age || !grade || !mentorId) {
    throw new Error("Todos los campos son obligatorios");
  }

  // Check mentor exists and doesn't already have a student (1:1 constraint)
  const mentor = await prisma.user.findUnique({
    where: { id: mentorId, role: "MENTOR" },
    include: { student: true },
  });

  if (!mentor) {
    throw new Error("El mentor seleccionado no existe");
  }

  if (mentor.student) {
    throw new Error("Este mentor ya tiene un alumno asignado");
  }

  await prisma.student.create({
    data: { name, age, grade, mentorId },
  });

  revalidatePath("/admin");
}

export async function reassignStudent(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "SUPERVISOR") {
    throw new Error("No autorizado");
  }

  const studentId = formData.get("studentId") as string;
  const newMentorId = formData.get("newMentorId") as string;

  if (!studentId || !newMentorId) {
    throw new Error("Todos los campos son obligatorios");
  }

  // Verify the new mentor doesn't already have a student
  const newMentor = await prisma.user.findUnique({
    where: { id: newMentorId, role: "MENTOR" },
    include: { student: true },
  });

  if (!newMentor) {
    throw new Error("El mentor seleccionado no existe");
  }

  if (newMentor.student) {
    throw new Error("Este mentor ya tiene un alumno asignado");
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { mentorId: newMentorId },
  });

  revalidatePath("/admin");
}
