import { IsNotEmpty, IsString } from 'class-validator';

export class HrPipelineQueryDto {
  @IsString()
  @IsNotEmpty()
  jobId!: string;
}
