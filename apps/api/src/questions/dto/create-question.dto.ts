import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  DIFFICULTIES,
  TOPICS,
  type Difficulty,
  type Topic,
} from '@tayyari/shared';

export class CreateQuestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  prompt!: string;

  @IsIn(TOPICS)
  topic!: Topic;

  @IsIn(DIFFICULTIES)
  difficulty!: Difficulty;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  options!: string[];

  @IsInt()
  @Min(0)
  correctIndex!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  explanation?: string;
}
