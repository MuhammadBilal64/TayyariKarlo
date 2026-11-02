import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EXPERIENCE_LEVELS, type ExperienceLevel } from '@tayyari/shared';

export class StartInterviewDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  role!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(60, { each: true })
  techStack!: string[];

  @IsIn(EXPERIENCE_LEVELS)
  experienceLevel!: ExperienceLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  questionCount?: number;
}
