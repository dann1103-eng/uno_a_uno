/**
 * Horas que aporta cada sesión registrada (tema o catequesis).
 * Fuente única de verdad para el cálculo de horas acumuladas de un tutor.
 */
export const HOURS_PER_SESSION = 3;

/** Horas acumuladas para una cantidad dada de sesiones. */
export function totalHours(sessionCount: number): number {
  return sessionCount * HOURS_PER_SESSION;
}
