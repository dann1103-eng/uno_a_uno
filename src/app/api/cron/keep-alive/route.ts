import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Prisma necesita el runtime de Node.js (no Edge)
export const runtime = "nodejs";
// Evita que Next cachee la respuesta: cada ejecución debe golpear la DB
export const dynamic = "force-dynamic";

/**
 * Cron diario para mantener activo el proyecto de Supabase (plan free).
 * Supabase pausa los proyectos tras ~7 días de inactividad; un query simple
 * cada día cuenta como actividad y evita la pausa.
 *
 * Lo invoca Vercel Cron (ver vercel.json). En producción se protege con la
 * variable de entorno CRON_SECRET: Vercel envía
 * `Authorization: Bearer <CRON_SECRET>` automáticamente.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      message: "Base de datos activa",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/keep-alive] Error al consultar la base de datos:", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo conectar a la base de datos" },
      { status: 500 }
    );
  }
}
