import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateParcelDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  location?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  crop?: string;
}
