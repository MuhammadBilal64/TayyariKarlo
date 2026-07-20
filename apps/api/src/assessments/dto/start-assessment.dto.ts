import { IsIn, IsInt, Max, Min } from 'class-validator';
import {
  DIFFICULTIES,
  TOPICS,
  type Difficulty,
  type Topic,
} from '@tayyari/shared';

export class StartAssessmentDto {
  @IsIn(TOPICS)
  topic!: Topic;

  @IsIn(DIFFICULTIES)
  difficulty!: Difficulty;

  @IsInt()
  @Min(1)
  @Max(50)
  count!: number;
}
