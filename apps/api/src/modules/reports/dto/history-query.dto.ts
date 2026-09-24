import { IsDateString } from 'class-validator';

export class HistoryQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
