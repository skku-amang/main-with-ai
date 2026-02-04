import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateTeamDto, UpdateTeamDto, TeamApplicationDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  create(
    @Body() dto: CreateTeamDto,
    @CurrentUser() user: { id: number },
  ) {
    // Force leaderId to be current user (unless admin creates for someone else)
    return this.teamService.create({ ...dto, leaderId: user.id });
  }

  @UseGuards(AdminGuard)
  @Post('admin')
  createAsAdmin(@Body() dto: CreateTeamDto) {
    return this.teamService.create(dto);
  }

  @Public()
  @Get()
  findAll(@Query('performanceId') performanceId?: string) {
    return this.teamService.findAll(
      performanceId ? parseInt(performanceId, 10) : undefined,
    );
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeamDto,
    @CurrentUser() user: { id: number; isAdmin: boolean },
  ) {
    return this.teamService.update(id, dto, user.id, user.isAdmin);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; isAdmin: boolean },
  ) {
    return this.teamService.remove(id, user.id, user.isAdmin);
  }

  @Post(':id/apply')
  apply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TeamApplicationDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.teamService.applyToTeam(id, user.id, dto);
  }

  @Delete(':id/leave')
  leave(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.teamService.leaveTeam(id, user.id);
  }
}
