import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { GenerationService } from './generation.service';
import { CreateGenerationDto, UpdateGenerationDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('generations')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() dto: CreateGenerationDto) {
    return this.generationService.create(dto);
  }

  @Public()
  @Get()
  findAll() {
    return this.generationService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.generationService.findOne(id);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGenerationDto,
  ) {
    return this.generationService.update(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.generationService.remove(id);
  }
}
