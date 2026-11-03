import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { AnswerInterviewDto } from './dto/answer-interview.dto';
import { StartInterviewDto } from './dto/start-interview.dto';
import { InterviewsService } from './interviews.service';
import { readAudioBody } from './speech/read-audio';

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

  @Post(':id/transcribe')
  transcribe(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return readAudioBody(req).then((audio) =>
      this.interviewsService.transcribeAnswer(user.sub, id, audio),
    );
  }

  @Post(':id/answer-audio')
  answerAudio(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return readAudioBody(req).then((audio) =>
      this.interviewsService.answerAudio(user.sub, id, audio),
    );
  }

  @Get(':id/turns/:turnId/audio')
  async turnAudio(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('turnId') turnId: string,
  ) {
    const wav = await this.interviewsService.turnAudio(user.sub, id, turnId);
    return new StreamableFile(wav, {
      type: 'audio/wav',
      disposition: 'inline',
    });
  }

  @Get(':id')
  getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.interviewsService.getForUser(user.sub, id);
  }
}
