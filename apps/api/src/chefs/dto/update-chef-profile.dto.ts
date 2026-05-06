import { IsString, IsOptional, IsNumber, IsBoolean, IsInt, Min, Max, MaxLength } from 'class-validator';

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
  @IsOptional() @IsInt() @Min(1) @Max(200) deliveryRadiusMiles?: number;
  @IsOptional() @IsString() deliveryTowns?: string;
  @IsOptional() @IsBoolean() offersInHome?: boolean;
  @IsOptional() @IsString() availableDays?: string;
  @IsOptional() @IsString() blockedDates?: string;
  @IsOptional() @IsInt() @Min(0) @Max(30) leadTimeDays?: number;
  @IsOptional() @IsInt() @Min(1) @Max(50) maxBookingsPerDay?: number;
}
