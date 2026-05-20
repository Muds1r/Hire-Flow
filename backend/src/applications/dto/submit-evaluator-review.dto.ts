import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/** Evaluator recommendation only — does not change Application status. */
export class SubmitEvaluatorReviewDto {
  @IsBoolean()
  passForNextPhase!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  summary?: string;
}
