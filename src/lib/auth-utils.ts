import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

type Role = "MENTOR" | "SUPERVISOR" | "SUBSTITUTE";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireRole(roles: Role | Role[]) {
  const user = await getCurrentUser();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role as Role)) redirect("/dashboard");
  return user;
}
