// src/lib/letter-templates.ts
import { HOURS_PER_SESSION, totalHours } from "@/lib/hours";

/**
 * Formatea una fecha como "9 de mayo de 2026".
 * Las fechas de sesión se guardan a medianoche UTC, por eso se formatea en UTC:
 * en la zona horaria de El Salvador (UTC-6) saldrían un día antes.
 */
export function formatLetterDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export interface HorasSocialesTemplateData {
  mentorName: string;
  career: string;
  university: string;
  studentId: string; // carnet
  sessionCount: number;
  periodStart: string; // ya formateada, ej. "9 de mayo de 2026"
  periodEnd: string;
}

function pluralHours(n: number): string {
  return n === 1 ? "1 hora" : `${n} horas`;
}

/** Texto visible cuando todavía falta un dato, para que se note en el borrador. */
function orPlaceholder(value: string, placeholder: string): string {
  return value.trim() || `[${placeholder}]`;
}

export function getHorasSocialesTemplate({
  mentorName,
  career,
  university,
  studentId,
  sessionCount,
  periodStart,
  periodEnd,
}: HorasSocialesTemplateData): string {
  const hours = totalHours(sessionCount);
  const sessionsLabel = sessionCount === 1 ? "1 sesión" : `${sessionCount} sesiones`;
  const hoursLabel = pluralHours(hours);
  const perSessionLabel = pluralHours(HOURS_PER_SESSION);
  const period =
    periodStart === periodEnd
      ? `El ${periodStart}`
      : `Durante el período comprendido entre el ${periodStart} y el ${periodEnd}`;

  return `Por medio de la presente, la Fundación ACTÚA hace constar que ${mentorName}, estudiante de la carrera de ${orPlaceholder(career, "carrera")} en la ${orPlaceholder(university, "universidad")}, con número de carnet ${orPlaceholder(studentId, "carnet")}, participó como mentor voluntario en el Programa Uno a Uno "Cambiando El Salvador", iniciativa dedicada al acompañamiento formativo, académico y personal de niños y jóvenes.

${period}, ${mentorName} realizó ${sessionsLabel} de mentoría con los estudiantes del programa, cada una con un valor de ${perSessionLabel}, acumulando un total de ${hoursLabel} de servicio social.

Dichas horas fueron cumplidas de manera voluntaria y desinteresada, y reflejan el compromiso y la vocación de servicio de ${mentorName} con esta iniciativa.

Se extiende la presente constancia a solicitud del interesado, en El Salvador, para que sea presentada ante su institución educativa como comprobante de horas de servicio social, y para los usos legales y personales que estime conveniente.`;
}

export function getConstanciaTemplate(mentorName: string): string {
  return `Por medio de la presente, el suscrito hace constar que ${mentorName} participa activamente como mentor voluntario en el Programa de Mentoría Uno a Uno, iniciativa dedicada al acompañamiento formativo, académico y personal de estudiantes de nivel primario.

En su rol de mentor, ${mentorName} dedica tiempo y esfuerzo de manera voluntaria y desinteresada al desarrollo integral de los jóvenes bajo su cuidado, contribuyendo significativamente a su formación en valores, hábitos de estudio y habilidades de vida.

El Programa de Mentoría Uno a Uno reconoce el compromiso y la labor de ${mentorName} como parte fundamental de esta iniciativa de voluntariado, la cual no genera ningún tipo de remuneración económica para los participantes.

Cabe destacar que la participación de ${mentorName} implica una dedicación constante a lo largo del ciclo escolar, asistiendo puntualmente a las sesiones programadas y manteniendo una comunicación activa con el equipo coordinador del programa, lo que refleja su seriedad y entrega hacia esta causa.

Se extiende la presente constancia a solicitud del interesado, en El Salvador, para los usos legales y personales que estime conveniente.`;
}

export function getRecomendacionTemplate(mentorName: string): string {
  return `Quien suscribe la presente se permite recomendar amplia y sinceramente a ${mentorName}, quien se ha desempeñado como mentor voluntario en el Programa de Mentoría Uno a Uno durante el presente ciclo formativo.

A lo largo de su participación, ${mentorName} ha demostrado un nivel sobresaliente de compromiso, puntualidad y responsabilidad en el cumplimiento de sus sesiones de mentoría. Su capacidad para establecer vínculos de confianza con los estudiantes y guiarlos en su desarrollo personal y académico lo distingue como un mentor ejemplar.

Asimismo, ha mostrado iniciativa, madurez y vocación de servicio, cualidades que lo hacen destacar entre sus pares y que reflejan el espíritu del programa: acompañar con integridad y dedicación.

Es importante señalar que la influencia positiva de ${mentorName} trasciende el aspecto académico, pues su acompañamiento ha contribuido al fortalecimiento del carácter y la autoestima de los estudiantes a su cargo, generando un impacto tangible en su vida cotidiana y en su entorno familiar.

Por todo lo anterior, extiendo la presente recomendación sin reserva alguna, con la plena convicción de que ${mentorName} será un aporte valioso en cualquier ámbito en que se desempeñe.`;
}
