import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CreatePackDto } from './dto/create-pack.dto.js';
import { PackChild } from './entities/pack-child.entity.js';
import { PackContent } from './entities/pack-content.entity.js';
import { Pack } from './entities/pack.entity.js';
import {
  buildChildrenByParent,
  buildContentByPack,
  collectUniqueContentIds,
  wouldIntroduceCycle,
} from './pack-graph.js';
import type { PackResponse } from './pack-response.js';

@Injectable()
export class PacksService {
  constructor(
    @InjectRepository(Pack)
    private readonly packsRepository: Repository<Pack>,
    @InjectRepository(PackChild)
    private readonly packChildrenRepository: Repository<PackChild>,
    @InjectRepository(PackContent)
    private readonly packContentsRepository: Repository<PackContent>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreatePackDto): Promise<PackResponse> {
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Pack, { where: { id: dto.id } });
      if (existing) {
        throw new ConflictException(`Pack with id "${dto.id}" already exists`);
      }

      const childPackIds = dto.childPackIds ?? [];
      const content = dto.content ?? [];

      if (childPackIds.length > 0) {
        if (childPackIds.includes(dto.id)) {
          throw new BadRequestException(
            'A pack cannot reference itself as a child',
          );
        }

        const foundChildren = await manager.findBy(Pack, {
          id: In(childPackIds),
        });
        if (foundChildren.length !== childPackIds.length) {
          throw new BadRequestException(
            'One or more childPackIds do not exist; create child packs before referencing them',
          );
        }

        const edges = await manager.find(PackChild);
        const childrenByParent = buildChildrenByParent(edges);
        if (wouldIntroduceCycle(dto.id, childPackIds, childrenByParent)) {
          throw new BadRequestException(
            'childPackIds would introduce a cycle in the pack graph',
          );
        }
      }

      const pack = manager.create(Pack, {
        id: dto.id,
        packName: dto.packName,
        active: dto.active,
        price: dto.price.toFixed(2),
      });
      await manager.save(pack);

      if (content.length > 0) {
        await manager.save(
          PackContent,
          content.map((contentId) =>
            manager.create(PackContent, { packId: dto.id, contentId }),
          ),
        );
      }

      if (childPackIds.length > 0) {
        await manager.save(
          PackChild,
          childPackIds.map((childPackId) =>
            manager.create(PackChild, {
              parentPackId: dto.id,
              childPackId,
            }),
          ),
        );
      }

      return toPackResponse(pack, content, childPackIds);
    });
  }

  async findAll(): Promise<PackResponse[]> {
    const packs = await this.packsRepository.find({
      relations: { childLinks: true, contents: true },
      order: { id: 'ASC' },
    });

    return packs.map((pack) =>
      toPackResponse(
        pack,
        (pack.contents ?? []).map((row) => row.contentId),
        (pack.childLinks ?? []).map((row) => row.childPackId),
      ),
    );
  }

  async getContent(id: string): Promise<string[]> {
    const root = await this.packsRepository.findOne({ where: { id } });
    if (!root) {
      throw new NotFoundException(`Pack with id "${id}" not found`);
    }

    const [edges, contentRows] = await Promise.all([
      this.packChildrenRepository.find(),
      this.packContentsRepository.find(),
    ]);

    return collectUniqueContentIds(
      id,
      buildChildrenByParent(edges),
      buildContentByPack(contentRows),
    );
  }
}

function toPackResponse(
  pack: Pack,
  content: string[],
  childPackIds: string[],
): PackResponse {
  return {
    id: pack.id,
    packName: pack.packName,
    active: pack.active,
    price: Number(pack.price),
    content,
    childPackIds,
  };
}
