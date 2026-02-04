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
} from '@nestjs/common';
import { RentalService } from './rental.service';
import { CreateRentalDto, UpdateRentalDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('rentals')
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Post()
  create(@Body() dto: CreateRentalDto) {
    return this.rentalService.create(dto);
  }

  @Public()
  @Get()
  findAll(
    @Query('type') type?: 'room' | 'item',
    @Query('equipmentId') equipmentId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.rentalService.findAll({
      type,
      equipmentId: equipmentId ? parseInt(equipmentId, 10) : undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('me')
  findMyRentals(@CurrentUser() user: { id: number }) {
    return this.rentalService.findMyRentals(user.id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rentalService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRentalDto,
    @CurrentUser() user: { id: number; isAdmin: boolean },
  ) {
    return this.rentalService.update(id, dto, user.id, user.isAdmin);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; isAdmin: boolean },
  ) {
    return this.rentalService.remove(id, user.id, user.isAdmin);
  }
}
