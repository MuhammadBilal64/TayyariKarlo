import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../../auth/jwt-payload';
import { SignalActionDto } from './dto/signal-action.dto';
import { SignalReplayDto } from './dto/signal-replay.dto';
import { StartSignalInterviewDto } from './dto/start-signal-interview.dto';
import { SignalInterviewsService } from './signal-interviews.service';

@Controller('signal-interviews')
@UseGuards(JwtAuthGuard)
export class SignalInterviewsController {
  constructor(private readonly signalInterviews: SignalInterviewsService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartSignalInterviewDto,
  ) {
    return this.signalInterviews.create(user.sub, dto);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.signalInterviews.listForUser(user.sub);
  }

  @Get(':id')
  getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.signalInterviews.getForUser(user.sub, id);
  }

  @Post(':id/actions')
  action(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SignalActionDto,
  ) {
    return this.signalInterviews.applyAction(user.sub, id, dto);
  }

  @Post(':id/replay')
  replay(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SignalReplayDto,
  ) {
    return this.signalInterviews.replay(user.sub, id, dto);
  }
}
