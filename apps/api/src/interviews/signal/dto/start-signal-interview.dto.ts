import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  EXPERIENCE_LEVELS,
  SIGNAL_VARIANTS,
  type ExperienceLevel,
  type SignalVariant,
} from '@tayyari/shared';

export class StartSignalInterviewDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  role?: string;

  @IsOptional()
  @IsIn(EXPERIENCE_LEVELS)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  scenarioId?: string;

  @IsOptional()
  @IsIn(SIGNAL_VARIANTS)
  variant?: SignalVariant;
}
