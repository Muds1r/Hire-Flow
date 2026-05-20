import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { TestIntensityLevel } from '../../common/test-intensity';

export class SubmitAssessmentConfigSectionDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsEnum(TestIntensityLevel)
  intensity: TestIntensityLevel;
}

export class SubmitAssessmentConfigDto {
  /** Legacy: per-section intensity (still supported). */
  @ValidateIf((o: SubmitAssessmentConfigDto) => !o.intensity && !o.sectionTitles?.length)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitAssessmentConfigSectionDto)
  @IsOptional()
  @ArrayMaxSize(10)
  sections?: SubmitAssessmentConfigSectionDto[];

  /** Compact: one intensity applied to every section title. */
  @ValidateIf((o: SubmitAssessmentConfigDto) => !o.sections?.length)
  @IsEnum(TestIntensityLevel)
  @IsOptional()
  intensity?: TestIntensityLevel;

  @ValidateIf((o: SubmitAssessmentConfigDto) => !o.sections?.length)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @IsOptional()
  sectionTitles?: string[];
}
