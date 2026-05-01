import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsString } from 'class-validator';

export class UpdateUserRolesBulkDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsString({ each: true })
  ids: string[];

  @IsIn(['CUSTOMER', 'CHEF', 'ADMIN'])
  role: 'CUSTOMER' | 'CHEF' | 'ADMIN';
}
