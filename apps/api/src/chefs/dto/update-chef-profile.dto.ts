import { IsString, IsOptional, IsNumber, IsBoolean, MaxLength } from 'class-validator';

export class UpdateChefProfileDto {
  @IsOptional() @IsString() @MaxLength(500) bio?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() tags?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() startingPrice?: string;
  @IsOptional() @IsString() responseTime?: string;
  @IsOptional() @IsBoolean() licensed?: boolean;
}
