import { Module } from '@nestjs/common';
import { HealthModule } from './common/health/health.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { QuestionsModule } from './questions/questions.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { ProgressModule } from './progress/progress.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { InterviewsModule } from './interviews/interviews.module';
import { CodingModule } from './coding/coding.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    QuestionsModule,
    AssessmentsModule,
    ProgressModule,
    RecommendationsModule,
    InterviewsModule,
    CodingModule,
  ],
})
export class AppModule {}
