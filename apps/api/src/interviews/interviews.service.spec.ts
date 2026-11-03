import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';
import { InterviewsService } from './interviews.service';
import { LLM_CLIENT } from './llm/llm.types';
import { SpeechService } from './speech/speech.service';

describe('InterviewsService', () => {
  let service: InterviewsService;
  let prisma: {
    interviewSession: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    interviewTurn: {
      updateMany: jest.Mock;
      create: jest.Mock;
    };
  };
  let llm: {
    provider: 'mock';
    generateQuestion: jest.Mock;
    evaluateAnswer: jest.Mock;
    summarize: jest.Mock;
  };
  let speech: {
    transcribe: jest.Mock;
    synthesize: jest.Mock;
  };

  const baseSession = {
    id: 'session-1',
    userId: 'user-1',
    role: 'Backend Engineer',
    techStack: ['Node.js', 'PostgreSQL'],
    experienceLevel: 'junior',
    questionCount: 2,
    status: 'in_progress',
    overallFeedback: null,
    overallScore: null,
    provider: 'mock',
    startedAt: new Date('2026-11-02T10:00:00.000Z'),
    completedAt: null,
    createdAt: new Date('2026-11-02T10:00:00.000Z'),
    updatedAt: new Date('2026-11-02T10:00:00.000Z'),
    turns: [
      {
        id: 'turn-1',
        sessionId: 'session-1',
        orderIndex: 0,
        kind: 'main',
        questionText: 'Practice Q1?',
        rubric: null,
        answerText: null,
        feedback: null,
        score: null,
        createdAt: new Date('2026-11-02T10:00:00.000Z'),
        updatedAt: new Date('2026-11-02T10:00:00.000Z'),
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      interviewSession: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      interviewTurn: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn(),
      },
    };
    speech = {
      transcribe: jest.fn().mockResolvedValue('Spoken answer about Node.'),
      synthesize: jest.fn().mockResolvedValue(Buffer.from('RIFFwav')),
    };
    llm = {
      provider: 'mock',
      generateQuestion: jest.fn().mockResolvedValue('Practice Q1?'),
      evaluateAnswer: jest.fn().mockResolvedValue({
        feedback: 'Practice feedback',
        score: 75,
        dimensions: {
          correctness: 75,
          depth: 75,
          tradeoffs: 70,
          clarity: 80,
        },
        followUp: null,
      }),
      summarize: jest.fn().mockResolvedValue({
        overallFeedback: 'Practice summary',
        overallScore: 75,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewsService,
        { provide: PrismaService, useValue: prisma },
        { provide: LLM_CLIENT, useValue: llm },
        { provide: SpeechService, useValue: speech },
      ],
    }).compile();

    service = module.get(InterviewsService);
  });

  it('creates a session with the first LLM question', async () => {
    prisma.interviewSession.create.mockResolvedValue(baseSession);

    const result = await service.create('user-1', {
      role: 'Backend Engineer',
      techStack: ['Node.js', 'PostgreSQL'],
      experienceLevel: 'junior',
      questionCount: 2,
    });

    expect(llm.generateQuestion).toHaveBeenCalled();
    expect(prisma.interviewSession.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        role: 'Backend Engineer',
        techStack: ['Node.js', 'PostgreSQL'],
        experienceLevel: 'junior',
        questionCount: 2,
        status: 'in_progress',
        provider: 'mock',
        turns: {
          create: [
            { orderIndex: 0, kind: 'main', questionText: 'Practice Q1?' },
          ],
        },
      },
      include: {
        turns: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    expect(result.turns).toHaveLength(1);
    expect(result.provider).toBe('mock');
  });

  it('lists sessions for the current user', async () => {
    prisma.interviewSession.findMany.mockResolvedValue([
      {
        ...baseSession,
        _count: { turns: 1 },
      },
    ]);

    const result = await service.listForUser('user-1');
    expect(result[0]?.turnCount).toBe(1);
  });

  it('answers an open turn and asks the next question', async () => {
    prisma.interviewSession.findFirst
      .mockResolvedValueOnce(baseSession)
      .mockResolvedValueOnce({
        ...baseSession,
        turns: [
          {
            ...baseSession.turns[0],
            answerText: 'My detailed answer about Node and APIs.',
            feedback: 'Practice feedback',
            score: 75,
          },
        ],
      })
      .mockResolvedValueOnce({
        ...baseSession,
        turns: [
          {
            ...baseSession.turns[0],
            answerText: 'My detailed answer about Node and APIs.',
            feedback: 'Practice feedback',
            score: 75,
          },
          {
            id: 'turn-2',
            sessionId: 'session-1',
            orderIndex: 1,
            kind: 'main',
            questionText: 'Practice Q2?',
            rubric: null,
            answerText: null,
            feedback: null,
            score: null,
            createdAt: new Date('2026-11-02T10:01:00.000Z'),
            updatedAt: new Date('2026-11-02T10:01:00.000Z'),
          },
        ],
      });
    llm.generateQuestion.mockResolvedValueOnce('Practice Q2?');

    const result = await service.answer(
      'user-1',
      'session-1',
      'My detailed answer about Node and APIs.',
    );

    expect(llm.evaluateAnswer).toHaveBeenCalled();
    expect(prisma.interviewTurn.updateMany).toHaveBeenCalled();
    expect(prisma.interviewTurn.create).toHaveBeenCalledWith({
      data: {
        sessionId: 'session-1',
        orderIndex: 1,
        kind: 'main',
        questionText: 'Practice Q2?',
      },
    });
    expect(result.turns).toHaveLength(2);
    expect(result.status).toBe('in_progress');
    expect(result.turns[0]?.score).toBeNull();
    expect(result.turns[0]?.feedback).toBeNull();
  });

  it('completes the session after the last answer', async () => {
    const lastOpen = {
      ...baseSession,
      questionCount: 1,
      turns: [baseSession.turns[0]],
    };
    const afterAnswer = {
      ...lastOpen,
      turns: [
        {
          ...baseSession.turns[0],
          answerText: 'Final answer with enough detail.',
          feedback: 'Practice feedback',
          score: 75,
        },
      ],
    };
    const completed = {
      ...afterAnswer,
      status: 'completed',
      completedAt: new Date('2026-11-02T10:05:00.000Z'),
      overallFeedback: 'Practice summary',
      overallScore: 75,
    };

    prisma.interviewSession.findFirst
      .mockResolvedValueOnce(lastOpen)
      .mockResolvedValueOnce(afterAnswer);
    prisma.interviewSession.update.mockResolvedValue(completed);

    const result = await service.answer(
      'user-1',
      'session-1',
      'Final answer with enough detail.',
    );

    expect(llm.summarize).toHaveBeenCalled();
    expect(result.status).toBe('completed');
    expect(result.overallScore).toBe(75);
    expect(prisma.interviewTurn.create).not.toHaveBeenCalled();
  });

  it('rejects answers on completed sessions', async () => {
    prisma.interviewSession.findFirst.mockResolvedValue({
      ...baseSession,
      status: 'completed',
    });

    await expect(
      service.answer('user-1', 'session-1', 'Late answer'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NotFoundException for missing sessions', async () => {
    prisma.interviewSession.findFirst.mockResolvedValue(null);

    await expect(
      service.getForUser('user-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('asks one follow-up on a weak main answer and does not finish the round', async () => {
    llm.evaluateAnswer.mockResolvedValue({
      feedback: 'Thin on trade-offs',
      score: 52,
      dimensions: {
        correctness: 60,
        depth: 40,
        tradeoffs: 30,
        clarity: 70,
      },
      followUp: 'Which consistency trade-off would you accept here?',
    });
    prisma.interviewSession.findFirst
      .mockResolvedValueOnce(baseSession)
      .mockResolvedValueOnce({
        ...baseSession,
        turns: [
          {
            ...baseSession.turns[0],
            answerText: 'I would just use a cache.',
            feedback: 'Thin on trade-offs',
            score: 52,
          },
          {
            id: 'turn-2',
            sessionId: 'session-1',
            orderIndex: 1,
            kind: 'follow_up',
            questionText: 'Which consistency trade-off would you accept here?',
            answerText: null,
            feedback: null,
            score: null,
            rubric: null,
            createdAt: new Date('2026-11-02T10:01:00.000Z'),
            updatedAt: new Date('2026-11-02T10:01:00.000Z'),
          },
        ],
      });

    const result = await service.answer(
      'user-1',
      'session-1',
      'I would just use a cache.',
    );

    expect(prisma.interviewTurn.create).toHaveBeenCalledWith({
      data: {
        sessionId: 'session-1',
        orderIndex: 1,
        kind: 'follow_up',
        questionText: 'Which consistency trade-off would you accept here?',
      },
    });
    expect(llm.generateQuestion).not.toHaveBeenCalled();
    expect(llm.summarize).not.toHaveBeenCalled();
    expect(result.turns[1]?.kind).toBe('follow_up');
    expect(result.turns[0]?.score).toBeNull();
  });

  it('does not ask a second follow-up', async () => {
    const followUpOpen = {
      ...baseSession,
      turns: [
        {
          ...baseSession.turns[0],
          answerText: 'I would just use a cache.',
          score: 52,
        },
        {
          id: 'turn-2',
          sessionId: 'session-1',
          orderIndex: 1,
          kind: 'follow_up',
          questionText: 'Which consistency trade-off would you accept here?',
          answerText: null,
          feedback: null,
          score: null,
          rubric: null,
          createdAt: new Date('2026-11-02T10:01:00.000Z'),
          updatedAt: new Date('2026-11-02T10:01:00.000Z'),
        },
      ],
    };
    llm.evaluateAnswer.mockResolvedValue({
      feedback: 'Still thin',
      score: 40,
      dimensions: {
        correctness: 40,
        depth: 40,
        tradeoffs: 40,
        clarity: 40,
      },
      followUp: 'Say more about staleness.',
    });
    prisma.interviewSession.findFirst
      .mockResolvedValueOnce(followUpOpen)
      .mockResolvedValueOnce({
        ...followUpOpen,
        turns: [
          followUpOpen.turns[0],
          {
            ...followUpOpen.turns[1],
            answerText: 'I would accept a few seconds of staleness.',
            score: 40,
          },
        ],
      })
      .mockResolvedValueOnce({
        ...followUpOpen,
        turns: [
          followUpOpen.turns[0],
          {
            ...followUpOpen.turns[1],
            answerText: 'I would accept a few seconds of staleness.',
            score: 40,
          },
          {
            id: 'turn-3',
            sessionId: 'session-1',
            orderIndex: 2,
            kind: 'main',
            questionText: 'Practice Q2?',
            answerText: null,
            feedback: null,
            score: null,
            rubric: null,
            createdAt: new Date('2026-11-02T10:02:00.000Z'),
            updatedAt: new Date('2026-11-02T10:02:00.000Z'),
          },
        ],
      });
    llm.generateQuestion.mockResolvedValue('Practice Q2?');

    const result = await service.answer(
      'user-1',
      'session-1',
      'I would accept a few seconds of staleness.',
    );

    expect(prisma.interviewTurn.create).toHaveBeenCalledWith({
      data: {
        sessionId: 'session-1',
        orderIndex: 2,
        kind: 'main',
        questionText: 'Practice Q2?',
      },
    });
    expect(
      result.turns.filter((turn) => turn.kind === 'follow_up'),
    ).toHaveLength(1);
  });

  it('does not re-score when the turn was already saved', async () => {
    prisma.interviewTurn.updateMany.mockResolvedValue({ count: 0 });
    prisma.interviewSession.findFirst
      .mockResolvedValueOnce(baseSession)
      .mockResolvedValueOnce({
        ...baseSession,
        turns: [
          {
            ...baseSession.turns[0],
            answerText: 'Already saved.',
            score: 75,
          },
        ],
      })
      .mockResolvedValueOnce({
        ...baseSession,
        turns: [
          {
            ...baseSession.turns[0],
            answerText: 'Already saved.',
            score: 75,
          },
          {
            id: 'turn-2',
            sessionId: 'session-1',
            orderIndex: 1,
            kind: 'main',
            questionText: 'Practice Q2?',
            answerText: null,
            feedback: null,
            score: null,
            rubric: null,
            createdAt: new Date('2026-11-02T10:01:00.000Z'),
            updatedAt: new Date('2026-11-02T10:01:00.000Z'),
          },
        ],
      });
    llm.generateQuestion.mockResolvedValue('Practice Q2?');

    await service.answer('user-1', 'session-1', 'A second copy of the answer.');

    expect(llm.evaluateAnswer).toHaveBeenCalledTimes(1);
    expect(prisma.interviewTurn.create).toHaveBeenCalledTimes(1);
  });

  it('leaves the turn open when the judge returns invalid JSON', async () => {
    prisma.interviewSession.findFirst.mockResolvedValue(baseSession);
    llm.evaluateAnswer.mockRejectedValue(new Error('invalid JSON'));

    await expect(
      service.answer('user-1', 'session-1', 'A real answer.'),
    ).rejects.toThrow('invalid JSON');

    expect(prisma.interviewTurn.updateMany).not.toHaveBeenCalled();
  });

  it('transcribes without scoring', async () => {
    prisma.interviewSession.findFirst.mockResolvedValue(baseSession);
    const wav = Buffer.alloc(44 + 32);
    wav.write('RIFF', 0);
    wav.writeUInt32LE(36 + 32, 4);
    wav.write('WAVE', 8);
    wav.write('fmt ', 12);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(16000, 24);
    wav.writeUInt32LE(32000, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write('data', 36);
    wav.writeUInt32LE(32, 40);

    const result = await service.transcribeAnswer('user-1', 'session-1', wav);

    expect(result.transcript).toBe('Spoken answer about Node.');
    expect(llm.evaluateAnswer).not.toHaveBeenCalled();
  });

  it('rejects audio that is not a wav', async () => {
    await expect(
      service.answerAudio('user-1', 'session-1', Buffer.from('webm')),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(speech.transcribe).not.toHaveBeenCalled();
  });

  it('does not synthesize another user turn', async () => {
    prisma.interviewSession.findFirst.mockResolvedValue(null);

    await expect(
      service.turnAudio('user-2', 'session-1', 'turn-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(speech.synthesize).not.toHaveBeenCalled();
  });
});
