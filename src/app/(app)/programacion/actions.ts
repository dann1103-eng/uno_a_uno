"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function saveTopicContent(formData: FormData) {
  const user = await getCurrentUser();
  if (user.role !== "SUPERVISOR") throw new Error("No autorizado");

  const topicNumber = parseInt(formData.get("topicNumber") as string);
  const content = (formData.get("content") as string) ?? "";
  const linksRaw = formData.get("links") as string;
  const visible = formData.get("visible") === "true";

  if (topicNumber < 1 || topicNumber > 21) throw new Error("Tema inválido");

  let links: { label: string; url: string }[] = [];
  try {
    links = JSON.parse(linksRaw || "[]");
  } catch {
    links = [];
  }

  await prisma.topicContent.upsert({
    where: { topicNumber },
    create: { topicNumber, content, links, visible },
    update: { content, links, visible },
  });

  revalidatePath("/programacion");
}

export async function toggleTopicVisibility(formData: FormData) {
  const user = await getCurrentUser();
  if (user.role !== "SUPERVISOR") throw new Error("No autorizado");

  const topicNumber = parseInt(formData.get("topicNumber") as string);
  const visible = formData.get("visible") === "true";

  await prisma.topicContent.upsert({
    where: { topicNumber },
    create: { topicNumber, content: "", links: [], visible },
    update: { visible },
  });

  revalidatePath("/programacion");
}
