import { IsNumber, IsOptional } from 'class-validator';

export class CreateReadingDto {
  @IsNumber()
  humidity!: number;

  @IsNumber()
  temperature!: number;

  @IsOptional()
  @IsNumber()
  ambientHumidity?: number;
}
