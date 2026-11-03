import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { AnswerInterviewDto } from './dto/answer-interview.dto';
import { StartInterviewDto } from './dto/start-interview.dto';
import { InterviewsService } from './interviews.service';

@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: StartInterviewDto) {
    return this.interviewsService.create(user.sub, dto);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.interviewsService.listForUser(user.sub);
  }

  @Post(':id/answer')
  answer(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AnswerInterviewDto,
  ) {
    return this.interviewsService.answer(user.sub, id, dto.answer);
  }

  @Post(':id/continue')
  continueSession(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.interviewsService.continue(user.sub, id);
  }

  @Get(':id')
  getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.interviewsService.getForUser(user.sub, id);
  }
}
