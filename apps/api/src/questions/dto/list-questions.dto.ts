import { IsIn, IsOptional } from 'class-validator';
import {
  DIFFICULTIES,
  TOPICS,
  type Difficulty,
  type Topic,
} from '@tayyari/shared';

export class ListQuestionsDto {
  @IsOptional()
  @IsIn(TOPICS)
  topic?: Topic;

  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;
}
