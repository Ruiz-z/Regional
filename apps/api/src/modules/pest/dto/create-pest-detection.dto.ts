import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePestDetectionDto {
  @IsString()
  zoneId!: string;

  @IsInt()
  @Min(0)
  count!: number;

  @IsOptional()
  @IsDateString()
  frameAt?: string;
}
