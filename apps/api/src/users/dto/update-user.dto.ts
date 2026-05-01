import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;
}
