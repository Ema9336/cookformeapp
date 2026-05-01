import { Controller, Get, Patch, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateComplianceDto } from './dto/update-compliance.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserRolesBulkDto } from './dto/update-user-roles-bulk.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Get('audit-logs')
  listAuditLogs(@Query('limit') limit?: string) {
    const parsed = Number(limit);
    const safeLimit = Number.isFinite(parsed) ? parsed : 100;
    return this.adminService.listAuditLogs(safeLimit);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(req.user.id, id, dto);
  }

  @Patch('users/roles/bulk')
  updateUserRolesBulk(
    @Req() req: any,
    @Body() dto: UpdateUserRolesBulkDto,
  ) {
    return this.adminService.updateUserRolesBulk(req.user.id, dto);
  }

  @Get('chefs')
  listChefs() {
    return this.adminService.listChefs();
  }

  @Patch('chefs/:id/compliance')
  updateCompliance(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateComplianceDto,
  ) {
    return this.adminService.updateCompliance(req.user.id, id, dto);
  }
}
