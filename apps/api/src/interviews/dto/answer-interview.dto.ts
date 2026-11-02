import { IsString, MaxLength, MinLength } from 'class-validator';

export class AnswerInterviewDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  answer!: string;
}
