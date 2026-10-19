import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProgressModule } from '../progress/progress.module';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [AuthModule, ProgressModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
