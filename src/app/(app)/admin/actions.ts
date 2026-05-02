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
  const role = formData.get("role") as "MENTOR" | "SUPERVISOR" | "SUBSTITUTE";

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
  const mentorId = (formData.get("mentorId") as string) || null;

  if (!name || !age || !grade) {
    throw new Error("Nombre, edad y grado son obligatorios");
  }

  if (mentorId) {
    const mentor = await prisma.user.findUnique({
      where: { id: mentorId, role: "MENTOR" },
    });

    if (!mentor) {
      throw new Error("El mentor seleccionado no existe");
    }
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

  const newMentor = await prisma.user.findUnique({
    where: { id: newMentorId, role: "MENTOR" },
  });

  if (!newMentor) {
    throw new Error("El mentor seleccionado no existe");
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { mentorId: newMentorId },
  });

  revalidatePath("/admin");
}

export async function unassignStudent(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "SUPERVISOR") {
    throw new Error("No autorizado");
  }

  const studentId = formData.get("studentId") as string;
  if (!studentId) throw new Error("ID de alumno requerido");

  await prisma.student.update({
    where: { id: studentId },
    data: { mentorId: null },
  });

  revalidatePath("/admin");
}

export async function deleteUser(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "SUPERVISOR") {
    throw new Error("No autorizado");
  }

  const userId = formData.get("userId") as string;
  if (!userId) throw new Error("ID de usuario requerido");

  if (userId === currentUser.id) {
    throw new Error("No puedes eliminarte a ti mismo");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { students: { select: { id: true } } },
  });

  if (!user) throw new Error("Usuario no encontrado");

  // Unassign all their students first (if any)
  await prisma.student.updateMany({
    where: { mentorId: userId },
    data: { mentorId: null },
  });

  // Sessions will have mentorId set to null via onDelete: SetNull
  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin");
}
