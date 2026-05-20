import {
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class SaveAnswerDto {
  @IsInt()
  @Min(0)
  sectionIndex: number;

  @IsInt()
  @Min(0)
  questionIndex: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  selectedOption?: number;

  @IsOptional()
  @IsBoolean()
  lock?: boolean;
}
