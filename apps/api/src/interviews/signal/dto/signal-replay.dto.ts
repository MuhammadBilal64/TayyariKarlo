import {
  IsIn,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class SignalReplayDto {
  @IsString()
  @MinLength(1)
  decisionId!: string;

  @IsIn(['keep', 'change'])
  keepOrChange!: 'keep' | 'change';

  /** Required when keepOrChange is "change"; ignored validators when "keep". */
  @ValidateIf((body: SignalReplayDto) => body.keepOrChange === 'change')
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  revisedDecisionKey?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  reasoning!: string;
}
