import { getCurrentUser } from "@/lib/auth-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { PasswordChangeForm } from "./password-change-form";

export default async function ConfiguracionPage() {
  const user = await getCurrentUser();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-container/60 mb-1">
          Configuración
        </p>
        <h1 className="text-3xl font-bold tracking-tight font-heading">
          Mi Cuenta
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu información personal
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-brand-amber" />
            Información de la cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Nombre</span>
            <span className="text-sm font-medium">{user.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Correo</span>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Rol</span>
            <span className="text-sm font-medium">
              {user.role === "SUPERVISOR"
                ? "Supervisor"
                : user.role === "SUBSTITUTE"
                  ? "Suplente"
                  : "Mentor"}
            </span>
          </div>
        </CardContent>
      </Card>

      <PasswordChangeForm />
    </div>
  );
}
