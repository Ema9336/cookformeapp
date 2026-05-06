import { IsBoolean } from 'class-validator';

export class UpdateBookableDto {
  @IsBoolean()
  isBookable: boolean;
}
