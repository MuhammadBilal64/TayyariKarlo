import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { createLlmClient } from './llm/llm.factory';
import { LLM_CLIENT } from './llm/llm.types';
import { SpeechService } from './speech/speech.service';

@Module({
  imports: [AuthModule],
  controllers: [InterviewsController],
  providers: [
    InterviewsService,
    SpeechService,
    {
      provide: LLM_CLIENT,
      inject: [ConfigService],
      useFactory: createLlmClient,
    },
  ],
  exports: [InterviewsService],
})
export class InterviewsModule {}
