import { IsInt, Min } from 'class-validator';

export class CreateIrrigationEventDto {
  @IsInt()
  @Min(1)
  durationMinutes!: number;
}
