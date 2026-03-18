import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireRole(role: "MENTOR" | "SUPERVISOR") {
  const user = await getCurrentUser();
  if (user.role !== role) redirect("/dashboard");
  return user;
}
