import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ChefsService } from './chefs.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { UpdateChefProfileDto } from './dto/update-chef-profile.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';

@Controller('chefs')
export class ChefsController {
  constructor(private chefsService: ChefsService) {}

  // Public: list all chefs
  @Get()
  findAll(@Query('limit') limit?: string) {
    return this.chefsService.findAll({ limit: limit ? parseInt(limit, 10) : undefined });
  }

  // Public: get chef by slug
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.chefsService.findBySlug(slug);
  }

  // Authenticated: get/create own chef profile
  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  getMyProfile(@Request() req: any) {
    return this.chefsService.getOrCreateChefProfile(req.user.id);
  }

  // Authenticated: update own chef profile
  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateMyProfile(@Request() req: any, @Body() dto: UpdateChefProfileDto) {
    return this.chefsService.updateProfile(req.user.id, dto);
  }

  // Authenticated: add menu item
  @UseGuards(JwtAuthGuard)
  @Post('me/menu')
  addMenuItem(@Request() req: any, @Body() dto: CreateMenuItemDto) {
    return this.chefsService.addMenuItem(req.user.id, dto);
  }

  // Authenticated: delete menu item
  @UseGuards(JwtAuthGuard)
  @Delete('me/menu/:itemId')
  deleteMenuItem(@Request() req: any, @Param('itemId') itemId: string) {
    return this.chefsService.deleteMenuItem(req.user.id, itemId);
  }
}
