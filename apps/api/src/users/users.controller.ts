import { Controller, Get, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me')
  updateMe(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.id, dto);
  }
}
