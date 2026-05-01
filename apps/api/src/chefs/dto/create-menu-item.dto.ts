import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateMenuItemDto {
  @IsString() @MaxLength(120) name: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() ingredients?: string;
  @IsOptional() @IsString() price?: string;
  @IsOptional() @IsString() category?: string;
}
