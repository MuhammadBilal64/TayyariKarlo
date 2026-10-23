import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ListQuestionsDto } from './dto/list-questions.dto';
import { QuestionsService } from './questions.service';

@Controller('questions')
@UseGuards(JwtAuthGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  list(@Query() query: ListQuestionsDto) {
    return this.questionsService.list(query);
  }

  @Post()
  create(@Body() dto: CreateQuestionDto) {
    return this.questionsService.create(dto);
  }

  /** Prefer `pnpm --filter @tayyari/api prisma:seed` in deploy pipelines. */
  @Post('seed')
  seed() {
    const allowHttpSeed =
      process.env.NODE_ENV !== 'production' ||
      process.env.ALLOW_QUESTION_SEED === 'true';
    if (!allowHttpSeed) {
      throw new ForbiddenException(
        'HTTP question seed is disabled in production',
      );
    }
    return this.questionsService.seed();
  }
}
