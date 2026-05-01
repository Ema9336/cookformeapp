import { IsString, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString() chefSlug: string;
  @IsDateString() date: string;
  @IsString() serviceType: string;
  @IsNumber() @Min(1) guestCount: number;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() allergies?: string;
  @IsOptional() @IsString() totalAmount?: string;
  @IsOptional() cart?: { name: string; qty: number; price?: string }[];
}
