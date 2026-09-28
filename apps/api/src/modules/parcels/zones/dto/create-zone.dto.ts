import {
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';

export class CreateZoneDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  humidityThreshold!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  areaHectares?: number;
}
