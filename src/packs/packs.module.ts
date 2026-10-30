import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackChild } from './entities/pack-child.entity.js';
import { PackContent } from './entities/pack-content.entity.js';
import { Pack } from './entities/pack.entity.js';
import { PacksController } from './packs.controller.js';
import { PacksService } from './packs.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Pack, PackChild, PackContent])],
  controllers: [PacksController],
  providers: [PacksService],
})
export class PacksModule {}
