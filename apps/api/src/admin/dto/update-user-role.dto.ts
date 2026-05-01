import { IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @IsIn(['CUSTOMER', 'CHEF', 'ADMIN'])
  role: 'CUSTOMER' | 'CHEF' | 'ADMIN';
}
