import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload';
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

  @Get(':id')
  getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.interviewsService.getForUser(user.sub, id);
  }
}
