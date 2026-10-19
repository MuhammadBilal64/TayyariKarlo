import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { AssessmentsService } from './assessments.service';
import { StartAssessmentDto } from './dto/start-assessment.dto';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';

@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post('start')
  start(@CurrentUser() user: JwtPayload, @Body() dto: StartAssessmentDto) {
    return this.assessmentsService.start(user.sub, dto);
  }

  @Post(':id/submit')
  submit(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SubmitAssessmentDto,
  ) {
    return this.assessmentsService.submit(user.sub, id, dto.answers);
  }

  @Get(':id')
  getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.assessmentsService.getForUser(user.sub, id);
  }
}
