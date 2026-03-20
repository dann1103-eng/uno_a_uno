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

  // Programming topics are now hardcoded in src/lib/programming-topics.ts

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
