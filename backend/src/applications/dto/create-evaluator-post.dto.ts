import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateEvaluatorPostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  sectionTitle!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  comment!: string;
}
