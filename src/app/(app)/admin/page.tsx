import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CreateUserForm } from "./create-user-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "SUPERVISOR") notFound();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Administración de usuarios</h1>
        <p className="text-muted-foreground text-sm">
          Crea cuentas para mentores y supervisores.
        </p>
      </div>

      <CreateUserForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuarios registrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant={user.role === "SUPERVISOR" ? "default" : "secondary"}>
                {user.role === "SUPERVISOR" ? "Supervisor" : "Mentor"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
