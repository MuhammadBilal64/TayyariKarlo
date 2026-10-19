import { PrismaClient } from '@prisma/client';
import { QUESTION_SEED } from '../src/questions/question.seed-data';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.question.findMany({
    select: { prompt: true },
  });
  const existingPrompts = new Set(existing.map((row) => row.prompt));
  const missing = QUESTION_SEED.filter(
    (item) => !existingPrompts.has(item.prompt),
  );

  if (missing.length === 0) {
    console.log(
      `Questions already up to date (${existing.length}); skipping seed.`,
    );
    return;
  }

  await prisma.question.createMany({
    data: missing.map((item) => ({
      prompt: item.prompt,
      topic: item.topic,
      difficulty: item.difficulty,
      options: item.options,
      correctIndex: item.correctIndex,
      explanation: item.explanation,
    })),
  });

  const count = await prisma.question.count();
  console.log(`Inserted ${missing.length} questions (total ${count}).`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
