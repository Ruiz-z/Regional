import { IsNumber, IsString, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateZoneDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  humidityThreshold!: number;
}
