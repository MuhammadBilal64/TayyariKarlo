import { PrismaClient } from '@prisma/client';
import { QUESTION_SEED } from '../src/questions/question.seed-data';

const prisma = new PrismaClient();

function optionsEqual(a: string[], b: string[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function main() {
  const existing = await prisma.question.findMany({
    select: {
      id: true,
      prompt: true,
      options: true,
      correctIndex: true,
      explanation: true,
      topic: true,
      difficulty: true,
    },
  });
  const byPrompt = new Map(existing.map((row) => [row.prompt, row]));

  const missing = QUESTION_SEED.filter((item) => !byPrompt.has(item.prompt));
  const stale = QUESTION_SEED.filter((item) => {
    const row = byPrompt.get(item.prompt);
    if (!row) return false;
    return (
      row.correctIndex !== item.correctIndex ||
      row.topic !== item.topic ||
      row.difficulty !== item.difficulty ||
      row.explanation !== (item.explanation ?? null) ||
      !optionsEqual(row.options, item.options)
    );
  });

  if (missing.length === 0 && stale.length === 0) {
    console.log(
      `Questions already up to date (${existing.length}); skipping seed.`,
    );
    return;
  }

  if (missing.length > 0) {
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
  }

  for (const item of stale) {
    const row = byPrompt.get(item.prompt);
    if (!row) continue;
    await prisma.question.update({
      where: { id: row.id },
      data: {
        topic: item.topic,
        difficulty: item.difficulty,
        options: item.options,
        correctIndex: item.correctIndex,
        explanation: item.explanation ?? null,
      },
    });
  }

  const count = await prisma.question.count();
  console.log(
    `Seed sync: inserted ${missing.length}, updated ${stale.length} (total ${count}).`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
