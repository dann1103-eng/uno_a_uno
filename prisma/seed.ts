import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.goalUpdate.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.sessionEvaluation.deleteMany();
  await prisma.session.deleteMany();
  await prisma.student.deleteMany();
  await prisma.programmingTopic.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // Users
  const [mentor1, mentor2, supervisor] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Carlos Pérez",
        email: "carlos@mentores.com",
        passwordHash: await hash("mentor123"),
        role: "MENTOR",
      },
    }),
    prisma.user.create({
      data: {
        name: "Ana González",
        email: "ana@mentores.com",
        passwordHash: await hash("mentor123"),
        role: "MENTOR",
      },
    }),
    prisma.user.create({
      data: {
        name: "Roberto López",
        email: "roberto@mentores.com",
        passwordHash: await hash("super123"),
        role: "SUPERVISOR",
      },
    }),
  ]);

  console.log("✅ Users created");

  // Students
  const [student1, student2] = await Promise.all([
    prisma.student.create({
      data: {
        name: "Miguel Torres",
        age: 15,
        grade: "3ro Bachillerato",
        mentorId: mentor1.id,
      },
    }),
    prisma.student.create({
      data: {
        name: "Sofía Ramírez",
        age: 14,
        grade: "2do Bachillerato",
        mentorId: mentor2.id,
      },
    }),
  ]);

  console.log("✅ Students created");

  // Programming Topics
  const topics = [
    {
      weekNumber: 1,
      title: "Construyendo Buenos Hábitos",
      description: "Explorar qué son los hábitos y cómo se forman. Reflexionar sobre los hábitos actuales del estudiante y su impacto en la vida diaria.",
      talkingPoints: "- ¿Qué hábitos tienes actualmente?\n- ¿Cuáles te ayudan y cuáles te perjudican?\n- ¿Cómo se forma un hábito según la ciencia?\n- El ciclo: señal → rutina → recompensa",
      activitySuggestion: "Hacer una lista de 3 hábitos que el estudiante quiere cultivar y diseñar un plan semanal simple para cada uno.",
    },
    {
      weekNumber: 2,
      title: "Responsabilidad y Compromisos",
      description: "Entender qué significa ser responsable en el hogar, la escuela y las relaciones personales.",
      talkingPoints: "- ¿Qué es ser responsable para ti?\n- Ejemplos de responsabilidad en casa y la escuela\n- Diferencia entre excusas y razones\n- Cómo cumplir compromisos difíciles",
      activitySuggestion: "Escribir 3 compromisos personales para la semana y revisar en la próxima sesión cuántos se cumplieron.",
    },
    {
      weekNumber: 3,
      title: "Manejo del Tiempo de Pantalla",
      description: "Reflexionar sobre el uso de dispositivos y redes sociales y su efecto en el bienestar y rendimiento.",
      talkingPoints: "- ¿Cuántas horas al día usas tu teléfono?\n- ¿Qué aplicaciones usas más?\n- ¿Cómo afecta el tiempo de pantalla tu descanso y estudio?\n- Estrategias para usar la tecnología de forma intencional",
      activitySuggestion: "Revisar el tiempo de uso en el teléfono durante una semana y proponer un límite realista para aplicaciones no educativas.",
    },
    {
      weekNumber: 4,
      title: "Amistad y Respeto",
      description: "Explorar cómo construir y mantener amistades saludables basadas en el respeto mutuo.",
      talkingPoints: "- ¿Qué hace a una buena amistad?\n- ¿Cómo manejas los conflictos con amigos?\n- Diferencia entre presión de grupo y decisiones propias\n- El respeto como base de las relaciones",
      activitySuggestion: "Identificar a 2 personas en su vida con quienes quiera fortalecer su relación y pensar en una acción concreta para lograrlo.",
    },
    {
      weekNumber: 5,
      title: "Equilibrio Personal",
      description: "Reconocer la importancia del bienestar físico, emocional y social para un desarrollo integral.",
      talkingPoints: "- ¿Cómo te sientes en general estas semanas?\n- ¿Descansas bien? ¿Haces ejercicio?\n- ¿Tienes tiempo para actividades que disfrutes?\n- Señales de estrés y cómo manejarlo",
      activitySuggestion: "Crear una 'rueda del bienestar' con 6 áreas (estudio, descanso, deporte, familia, amigos, hobbies) y calificar del 1-10 cada área.",
    },
    {
      weekNumber: 6,
      title: "Metas y Sueños",
      description: "Ayudar al estudiante a clarificar sus sueños y transformarlos en metas concretas y alcanzables.",
      talkingPoints: "- ¿Qué quieres hacer cuando termines la escuela?\n- Diferencia entre sueño y meta\n- Metas SMART (específicas, medibles, alcanzables, relevantes, temporales)\n- ¿Qué obstáculos ves?",
      activitySuggestion: "Escribir 1 meta grande a 1 año y desglosarla en 3 pasos pequeños que pueda empezar esta semana.",
    },
    {
      weekNumber: 7,
      title: "Comunicación Efectiva",
      description: "Desarrollar habilidades para comunicarse con claridad, empatía y asertividad en diferentes contextos.",
      talkingPoints: "- ¿Cómo te comunicas con tus padres? ¿Con tus amigos?\n- ¿Qué es la comunicación asertiva?\n- Escucha activa: cómo practicarla\n- Cómo pedir y recibir ayuda",
      activitySuggestion: "Juego de rol: practicar cómo pedir algo difícil (un permiso, expresar un desacuerdo) de forma respetuosa.",
    },
    {
      weekNumber: 8,
      title: "Gratitud y Positividad",
      description: "Cultivar una actitud de gratitud y aprender a ver lo positivo incluso en situaciones difíciles.",
      talkingPoints: "- ¿Qué es la gratitud y por qué importa?\n- ¿Por qué cosas estás agradecido esta semana?\n- Cómo la negatividad afecta nuestro desempeño\n- El diario de gratitud como práctica",
      activitySuggestion: "Escribir 3 cosas por las que estar agradecido cada día durante una semana. Compartir al inicio de la siguiente sesión.",
    },
  ];

  await prisma.programmingTopic.createMany({ data: topics });

  console.log("✅ Programming topics created");

  // Sessions for student1
  const sessionDates = [
    new Date("2025-01-10"),
    new Date("2025-01-17"),
    new Date("2025-01-24"),
    new Date("2025-01-31"),
    new Date("2025-02-07"),
    new Date("2025-02-14"),
  ];

  const sessionTopics = [
    "Construyendo Buenos Hábitos",
    "Responsabilidad y Compromisos",
    "Manejo del Tiempo de Pantalla",
    "Amistad y Respeto",
    "Equilibrio Personal",
    "Metas y Sueños",
  ];

  const evaluations = [
    { discipline: 3, responsibility: 3, study: 2, relationships: 4, balance: 3 },
    { discipline: 3, responsibility: 4, study: 3, relationships: 4, balance: 3 },
    { discipline: 4, responsibility: 4, study: 3, relationships: 4, balance: 4 },
    { discipline: 4, responsibility: 4, study: 4, relationships: 5, balance: 4 },
    { discipline: 4, responsibility: 5, study: 4, relationships: 5, balance: 4 },
    { discipline: 5, responsibility: 5, study: 4, relationships: 5, balance: 5 },
  ];

  for (let i = 0; i < sessionDates.length; i++) {
    await prisma.session.create({
      data: {
        studentId: student1.id,
        mentorId: mentor1.id,
        date: sessionDates[i],
        formationTopic: sessionTopics[i],
        notes: `Sesión productiva. Miguel mostró interés en el tema de ${sessionTopics[i].toLowerCase()}.`,
        nextSteps: "Practicar lo aprendido durante la semana y traer reflexiones para la próxima sesión.",
        evaluation: { create: evaluations[i] },
      },
    });
  }

  console.log("✅ Sessions for student1 created");

  // Sessions for student2
  const evaluations2 = [
    { discipline: 2, responsibility: 3, study: 3, relationships: 3, balance: 2 },
    { discipline: 3, responsibility: 3, study: 3, relationships: 4, balance: 3 },
    { discipline: 3, responsibility: 4, study: 4, relationships: 4, balance: 3 },
  ];

  for (let i = 0; i < 3; i++) {
    await prisma.session.create({
      data: {
        studentId: student2.id,
        mentorId: mentor2.id,
        date: sessionDates[i],
        formationTopic: sessionTopics[i],
        notes: `Sofía participó activamente en la sesión sobre ${sessionTopics[i].toLowerCase()}.`,
        nextSteps: "Reflexionar sobre lo aprendido y aplicarlo en situaciones concretas.",
        evaluation: { create: evaluations2[i] },
      },
    });
  }

  console.log("✅ Sessions for student2 created");

  // Goals for student1
  const goal1 = await prisma.goal.create({
    data: {
      studentId: student1.id,
      title: "Mejorar hábitos de estudio",
      description: "Estudiar al menos 1 hora diaria sin distracciones",
      startDate: new Date("2025-01-10"),
      endDate: new Date("2025-03-10"),
      status: "ACTIVE",
      updates: {
        create: [
          { date: new Date("2025-01-17"), progressNote: "Esta semana estudió 5 de 7 días. Buen avance inicial." },
          { date: new Date("2025-01-31"), progressNote: "Estableció un horario fijo de 7-8pm. Mejora notable en concentración." },
        ],
      },
    },
  });

  const goal2 = await prisma.goal.create({
    data: {
      studentId: student1.id,
      title: "Reducir tiempo en redes sociales",
      description: "Limitar el uso de Instagram y TikTok a 30 min por día",
      startDate: new Date("2025-01-24"),
      status: "ACTIVE",
      updates: {
        create: [
          { date: new Date("2025-02-07"), progressNote: "Logró reducir de 3 horas a 1.5 horas diarias. Sigue trabajando." },
        ],
      },
    },
  });

  console.log("✅ Goals created");

  console.log("\n🎉 Database seeded successfully!\n");
  console.log("Demo accounts:");
  console.log("  Mentor 1: carlos@mentores.com / mentor123");
  console.log("  Mentor 2: ana@mentores.com / mentor123");
  console.log("  Supervisor: roberto@mentores.com / super123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
