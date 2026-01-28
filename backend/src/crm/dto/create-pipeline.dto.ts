import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePipelineDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
