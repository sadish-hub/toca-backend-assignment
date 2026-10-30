import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreatePackDto } from './dto/create-pack.dto.js';
import type { PackResponse } from './pack-response.js';
import { PacksService } from './packs.service.js';

@Controller('packs')
export class PacksController {
  constructor(private readonly packsService: PacksService) {}

  @Post()
  create(@Body() createPackDto: CreatePackDto): Promise<PackResponse> {
    return this.packsService.create(createPackDto);
  }

  @Get()
  findAll(): Promise<PackResponse[]> {
    return this.packsService.findAll();
  }

  @Get(':id/content')
  getContent(@Param('id') id: string): Promise<string[]> {
    return this.packsService.getContent(id);
  }
}
