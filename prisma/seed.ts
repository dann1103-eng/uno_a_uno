import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const hash = (pw: string) => bcrypt.hash(pw, 10);

const mentorStudentPairs = [
  { mentor: "Eduardo Lima", email: "eduardo.lima@mentores.com", student: "Blanco Figueroa, Liam Alejandro", listNum: 1 },
  { mentor: "Eduardo García", email: "eduardo.garcia@mentores.com", student: "Díaz Zuleta, Francisco Javier", listNum: 3 },
  { mentor: "Diego Posada", email: "diego.posada@mentores.com", student: "Galicia Alberto, Matias Osiel", listNum: 5 },
  { mentor: "Aristides Méndez", email: "aristides.mendez@mentores.com", student: "Granados Montenegro, Rene Daniel", listNum: 7 },
  { mentor: "Fernando Medina", email: "fernando.medina@mentores.com", student: "Landaverde Molina, Christopher Daniel", listNum: 9 },
  { mentor: "Edgardo Gálvez", email: "edgardo.galvez@mentores.com", student: "Menéndez Molina, Sebastian Alexander", listNum: 11 },
  { mentor: "Sebastián Mena", email: "sebastian.mena@mentores.com", student: "Olmedo García, William Alfonso", listNum: 13 },
  { mentor: "Diego Martínez", email: "diego.martinez@mentores.com", student: "Ortiz Morán, Angel Oswaldo", listNum: 14 },
  { mentor: "Xavier Ochoa", email: "xavier.ochoa@mentores.com", student: "Reyes Cortez, Andree Rafael", listNum: 15 },
  { mentor: "Edgardo Guzmán", email: "edgardo.guzman@mentores.com", student: "Sandoval Martínez, Pedro Enmanuel", listNum: 17 },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.goalUpdate.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.sessionEvaluation.deleteMany();
  await prisma.session.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  // Create supervisor
  const supervisor = await prisma.user.create({
    data: {
      name: "Roberto López",
      email: "roberto@mentores.com",
      passwordHash: await hash("super123"),
      role: "SUPERVISOR",
    },
  });
  console.log("✅ Supervisor created");

  // Create mentors and students
  for (const pair of mentorStudentPairs) {
    const mentor = await prisma.user.create({
      data: {
        name: pair.mentor,
        email: pair.email,
        passwordHash: await hash("mentor123"),
        role: "MENTOR",
      },
    });

    await prisma.student.create({
      data: {
        name: pair.student,
        age: 10,
        grade: "4to Grado",
        mentorId: mentor.id,
      },
    });

    console.log(`✅ ${pair.mentor} → ${pair.student}`);
  }

  console.log("\n✅ All mentors and students created");

  // Create sample sessions for the first two mentor-student pairs
  const firstMentor = await prisma.user.findUnique({
    where: { email: "eduardo.lima@mentores.com" },
    include: { student: true },
  });

  if (firstMentor?.student) {
    const sessionTopics = ["La Prudencia", "La Fortaleza", "La Templanza"];
    const evaluations = [
      { discipline: 3, responsibility: 3, study: 2, relationships: 4, family: 3, piety: 3 },
      { discipline: 3, responsibility: 4, study: 3, relationships: 4, family: 4, piety: 3 },
      { discipline: 4, responsibility: 4, study: 3, relationships: 4, family: 4, piety: 4 },
    ];

    for (let i = 0; i < sessionTopics.length; i++) {
      await prisma.session.create({
        data: {
          studentId: firstMentor.student.id,
          mentorId: firstMentor.id,
          date: new Date(`2026-02-${10 + i * 7}`),
          formationTopic: sessionTopics[i],
          notes: `Sesión productiva sobre ${sessionTopics[i].toLowerCase()}. El alumno mostró buena disposición.`,
          nextSteps: "Practicar lo aprendido durante la semana.",
          evaluation: { create: evaluations[i] },
        },
      });
    }
    console.log("✅ Sample sessions for Eduardo Lima created");
  }

  const secondMentor = await prisma.user.findUnique({
    where: { email: "eduardo.garcia@mentores.com" },
    include: { student: true },
  });

  if (secondMentor?.student) {
    const sessionTopics = ["La Prudencia", "La Fortaleza"];
    const evaluations = [
      { discipline: 2, responsibility: 3, study: 3, relationships: 3, family: 2, piety: 3 },
      { discipline: 3, responsibility: 3, study: 3, relationships: 4, family: 3, piety: 3 },
    ];

    for (let i = 0; i < sessionTopics.length; i++) {
      await prisma.session.create({
        data: {
          studentId: secondMentor.student.id,
          mentorId: secondMentor.id,
          date: new Date(`2026-02-${10 + i * 7}`),
          formationTopic: sessionTopics[i],
          notes: `Buena participación en el tema de ${sessionTopics[i].toLowerCase()}.`,
          nextSteps: "Reflexionar sobre lo aprendido y aplicarlo.",
          evaluation: { create: evaluations[i] },
        },
      });
    }
    console.log("✅ Sample sessions for Eduardo García created");
  }

  console.log("\n🎉 Database seeded successfully!\n");
  console.log("Demo accounts:");
  console.log("  Supervisor: roberto@mentores.com / super123");
  console.log("  Mentores (todos con password: mentor123):");
  for (const pair of mentorStudentPairs) {
    console.log(`    ${pair.mentor}: ${pair.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
