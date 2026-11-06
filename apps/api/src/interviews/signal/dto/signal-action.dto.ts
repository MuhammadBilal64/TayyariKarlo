import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const ACTION_TYPES = [
  'request_evidence',
  'ask_question',
  'submit_hypothesis',
  'revise_hypothesis',
  'commit_decision',
  'advance_clock',
] as const;

export class SignalActionDto {
  @IsIn(ACTION_TYPES)
  type!: (typeof ACTION_TYPES)[number];

  @ValidateIf((body: SignalActionDto) => body.type === 'request_evidence')
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  evidenceKey?: string;

  @ValidateIf((body: SignalActionDto) => body.type === 'ask_question')
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  question?: string;

  @ValidateIf(
    (body: SignalActionDto) =>
      body.type === 'submit_hypothesis' || body.type === 'revise_hypothesis',
  )
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  claim?: string;

  @ValidateIf(
    (body: SignalActionDto) =>
      body.type === 'submit_hypothesis' ||
      body.type === 'revise_hypothesis' ||
      body.type === 'commit_decision',
  )
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  supportingEvidenceKeys?: string[];

  @ValidateIf(
    (body: SignalActionDto) =>
      body.type === 'submit_hypothesis' || body.type === 'revise_hypothesis',
  )
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  missingEvidence?: string;

  @ValidateIf(
    (body: SignalActionDto) =>
      body.type === 'submit_hypothesis' || body.type === 'revise_hypothesis',
  )
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  confidence?: number;

  @ValidateIf((body: SignalActionDto) => body.type === 'revise_hypothesis')
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reason?: string;

  @ValidateIf((body: SignalActionDto) => body.type === 'commit_decision')
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  decisionKey?: string;

  @ValidateIf((body: SignalActionDto) => body.type === 'commit_decision')
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  reasoning?: string;

  @ValidateIf((body: SignalActionDto) => body.type === 'commit_decision')
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  expectedEffect?: string;

  @ValidateIf((body: SignalActionDto) => body.type === 'commit_decision')
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  verificationPlan?: string;

  @ValidateIf((body: SignalActionDto) => body.type === 'advance_clock')
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(600)
  seconds?: number;
}
