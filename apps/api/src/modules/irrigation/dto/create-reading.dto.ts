import { IsNumber } from 'class-validator';

export class CreateReadingDto {
  @IsNumber()
  humidity!: number;

  @IsNumber()
  temperature!: number;
}
