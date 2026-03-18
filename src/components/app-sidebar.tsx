"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BookOpen,
  User,
  PlusCircle,
  Target,
  Users,
  GraduationCap,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type User = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

const mentorNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Programación", url: "/programacion", icon: BookOpen },
  { title: "Mi Estudiante", url: "/mi-estudiante", icon: User },
  { title: "Nueva Sesión", url: "/sesiones/nueva", icon: PlusCircle },
  { title: "Metas", url: "/metas", icon: Target },
];

const supervisorNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Mentores", url: "/mentores", icon: Users },
  { title: "Estudiantes", url: "/estudiantes", icon: GraduationCap },
  { title: "Usuarios", url: "/admin", icon: ShieldCheck },
];

export function AppSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const isSupervisor = user.role === "SUPERVISOR";
  const navItems = isSupervisor ? supervisorNav : mentorNav;
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            M
          </div>
          <span className="font-semibold text-sm">Mentores 1a1</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    render={<Link href={item.url} />}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {isSupervisor ? "Supervisor" : "Mentor"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
