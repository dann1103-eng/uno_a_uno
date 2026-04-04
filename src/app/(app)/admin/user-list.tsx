"use client";

import { useState } from "react";
import { deleteUser } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function roleBadge(role: string) {
  if (role === "SUPERVISOR")
    return { label: "Supervisor", className: "bg-[#1e3a5f] text-white hover:bg-[#022448]" };
  if (role === "SUBSTITUTE")
    return { label: "Suplente", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" };
  return { label: "Mentor", className: "bg-[#d4a843]/15 text-[#5b4300] hover:bg-[#d4a843]/25" };
}

export function UserList({
  users,
  currentUserId,
}: {
  users: UserItem[];
  currentUserId: string;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete(userId: string) {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("userId", userId);
      await deleteUser(fd);
      setConfirmId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-none shadow-[0_12px_32px_rgba(2,36,72,0.06)]">
      <CardHeader>
        <CardTitle className="text-base text-[#1e3a5f]">Usuarios registrados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {error && <p className="text-sm text-destructive mb-2">{error}</p>}
        {users.map((user) => {
          const badge = roleBadge(user.role);
          const isConfirming = confirmId === user.id;
          const isSelf = user.id === currentUserId;

          return (
            <div
              key={user.id}
              className="flex items-center justify-between py-3 rounded-lg hover:bg-[#d5e3ff]/10 px-2 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={badge.className}>{badge.label}</Badge>
                {!isSelf && (
                  <>
                    {isConfirming ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={loading}
                          onClick={() => handleDelete(user.id)}
                        >
                          {loading ? "..." : "Confirmar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmId(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
