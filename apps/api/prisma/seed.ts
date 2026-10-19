import { PrismaClient } from '@prisma/client';
import { QUESTION_SEED } from '../src/questions/question.seed-data';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.question.count();
  if (existing > 0) {
    console.log(`Questions already present (${existing}); skipping seed.`);
    return;
  }

  await prisma.question.createMany({
    data: QUESTION_SEED.map((item) => ({
      prompt: item.prompt,
      topic: item.topic,
      difficulty: item.difficulty,
      options: item.options,
      correctIndex: item.correctIndex,
      explanation: item.explanation,
    })),
  });

  console.log(`Seeded ${QUESTION_SEED.length} questions.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
