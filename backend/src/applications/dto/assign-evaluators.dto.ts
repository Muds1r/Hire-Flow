import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AssignEvaluatorsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  evaluatorIds: string[];
}
