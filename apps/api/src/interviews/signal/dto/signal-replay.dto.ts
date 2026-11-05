import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignalReplayDto {
  @IsString()
  @MinLength(1)
  decisionId!: string;

  @IsIn(['keep', 'change'])
  keepOrChange!: 'keep' | 'change';

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  revisedDecisionKey?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  reasoning!: string;
}
