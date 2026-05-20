import { ArrayMinSize, IsArray, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  /** Evaluator user ids to receive this JD before it is published. */
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  evaluatorIds: string[];
}
