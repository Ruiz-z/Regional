import { IsString, IsNotEmpty } from 'class-validator';

export class CreateParcelDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsString()
  @IsNotEmpty()
  crop!: string;
}
