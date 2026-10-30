import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PackChild } from './entities/pack-child.entity.js';
import { PackContent } from './entities/pack-content.entity.js';
import { Pack } from './entities/pack.entity.js';
import { PacksService } from './packs.service.js';

describe('PacksService', () => {
  let service: PacksService;
  let packsRepository: {
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
  };
  let packChildrenRepository: { find: ReturnType<typeof vi.fn> };
  let packContentsRepository: { find: ReturnType<typeof vi.fn> };
  let manager: {
    findOne: ReturnType<typeof vi.fn>;
    findBy: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let dataSource: { transaction: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    packsRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
    };
    packChildrenRepository = { find: vi.fn() };
    packContentsRepository = { find: vi.fn() };
    manager = {
      findOne: vi.fn(),
      findBy: vi.fn(),
      find: vi.fn(),
      create: vi.fn((_entity: unknown, data: unknown) => data),
      save: vi.fn((entityOrEntities: unknown) =>
        Promise.resolve(entityOrEntities),
      ),
    };
    dataSource = {
      transaction: vi.fn(async (cb: (m: typeof manager) => Promise<unknown>) =>
        cb(manager),
      ),
    };

    service = new PacksService(
      packsRepository as unknown as Repository<Pack>,
      packChildrenRepository as unknown as Repository<PackChild>,
      packContentsRepository as unknown as Repository<PackContent>,
      dataSource as unknown as DataSource,
    );
  });

  describe('create', () => {
    it('persists a pack without children or content', async () => {
      manager.findOne.mockResolvedValue(null);

      const result = await service.create({
        id: 'pack.school',
        packName: 'The School Pack',
        active: true,
        price: 10,
      });

      expect(result).toEqual({
        id: 'pack.school',
        packName: 'The School Pack',
        active: true,
        price: 10,
        content: [],
        childPackIds: [],
      });
      expect(manager.save).toHaveBeenCalled();
    });

    it('throws ConflictException when pack id already exists', async () => {
      manager.findOne.mockResolvedValue({ id: 'pack.school' });

      await expect(
        service.create({
          id: 'pack.school',
          packName: 'Dup',
          active: true,
          price: 1,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws BadRequestException for self-referencing childPackIds', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          id: 'pack.a',
          packName: 'A',
          active: true,
          price: 1,
          childPackIds: ['pack.a'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when a childPackId does not exist', async () => {
      manager.findOne.mockResolvedValue(null);
      manager.findBy.mockResolvedValue([]);

      await expect(
        service.create({
          id: 'pack.parent',
          packName: 'Parent',
          active: true,
          price: 1,
          childPackIds: ['pack.missing'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when childPackIds would introduce a cycle', async () => {
      manager.findOne.mockResolvedValue(null);
      manager.findBy.mockResolvedValue([{ id: 'pack.a' }]);
      // Existing edge: a → b. Creating b with child a cycles.
      manager.find.mockResolvedValue([
        { parentPackId: 'pack.a', childPackId: 'pack.b' },
      ]);

      await expect(
        service.create({
          id: 'pack.b',
          packName: 'B',
          active: true,
          price: 1,
          childPackIds: ['pack.a'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('maps entities to the API response shape', async () => {
      packsRepository.find.mockResolvedValue([
        {
          id: 'pack.school',
          packName: 'The School Pack',
          active: true,
          price: '10.00',
          contents: [{ contentId: 'furniture.whiteboard' }],
          childLinks: [{ childPackId: 'pack.classroom' }],
        },
      ]);

      await expect(service.findAll()).resolves.toEqual([
        {
          id: 'pack.school',
          packName: 'The School Pack',
          active: true,
          price: 10,
          content: ['furniture.whiteboard'],
          childPackIds: ['pack.classroom'],
        },
      ]);
    });
  });

  describe('getContent', () => {
    it('throws NotFoundException when the root pack is missing', async () => {
      packsRepository.findOne.mockResolvedValue(null);

      await expect(service.getContent('pack.missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns unique nested content via in-app BFS including inactive packs', async () => {
      packsRepository.findOne.mockResolvedValue({
        id: 'pack.parent',
        active: true,
      });
      packChildrenRepository.find.mockResolvedValue([
        { parentPackId: 'pack.parent', childPackId: 'pack.inactive' },
      ]);
      packContentsRepository.find.mockResolvedValue([
        { packId: 'pack.parent', contentId: 'c.parent' },
        { packId: 'pack.inactive', contentId: 'c.child' },
        { packId: 'pack.inactive', contentId: 'c.parent' },
      ]);

      await expect(service.getContent('pack.parent')).resolves.toEqual(
        expect.arrayContaining(['c.parent', 'c.child']),
      );
      await expect(service.getContent('pack.parent')).resolves.toHaveLength(2);
    });

    it('aggregates unique content across a 5-level deep chain', async () => {
      packsRepository.findOne.mockResolvedValue({ id: 'pack.a', active: true });
      packChildrenRepository.find.mockResolvedValue([
        { parentPackId: 'pack.a', childPackId: 'pack.b' },
        { parentPackId: 'pack.b', childPackId: 'pack.c' },
        { parentPackId: 'pack.c', childPackId: 'pack.d' },
        { parentPackId: 'pack.d', childPackId: 'pack.e' },
      ]);
      packContentsRepository.find.mockResolvedValue([
        { packId: 'pack.a', contentId: 'c.a' },
        { packId: 'pack.b', contentId: 'c.b' },
        { packId: 'pack.c', contentId: 'c.c' },
        { packId: 'pack.d', contentId: 'c.d' },
        { packId: 'pack.e', contentId: 'c.e' },
      ]);

      await expect(service.getContent('pack.a')).resolves.toEqual(
        expect.arrayContaining(['c.a', 'c.b', 'c.c', 'c.d', 'c.e']),
      );
      await expect(service.getContent('pack.a')).resolves.toHaveLength(5);
    });

    it('dedupes content shared between level 1 and level 5 of a deep chain', async () => {
      packsRepository.findOne.mockResolvedValue({ id: 'pack.a', active: true });
      packChildrenRepository.find.mockResolvedValue([
        { parentPackId: 'pack.a', childPackId: 'pack.b' },
        { parentPackId: 'pack.b', childPackId: 'pack.c' },
        { parentPackId: 'pack.c', childPackId: 'pack.d' },
        { parentPackId: 'pack.d', childPackId: 'pack.e' },
      ]);
      packContentsRepository.find.mockResolvedValue([
        { packId: 'pack.a', contentId: 'c.shared' },
        { packId: 'pack.b', contentId: 'c.b' },
        { packId: 'pack.c', contentId: 'c.c' },
        { packId: 'pack.d', contentId: 'c.d' },
        { packId: 'pack.e', contentId: 'c.shared' },
        { packId: 'pack.e', contentId: 'c.e-only' },
      ]);

      const result = await service.getContent('pack.a');
      expect(result.sort()).toEqual([
        'c.b',
        'c.c',
        'c.d',
        'c.e-only',
        'c.shared',
      ]);
    });

    it('resolves a wide root with a deep mid-branch uniquely', async () => {
      packsRepository.findOne.mockResolvedValue({ id: 'root', active: true });
      packChildrenRepository.find.mockResolvedValue([
        { parentPackId: 'root', childPackId: 'left' },
        { parentPackId: 'root', childPackId: 'mid' },
        { parentPackId: 'root', childPackId: 'right' },
        { parentPackId: 'mid', childPackId: 'mid.g1' },
        { parentPackId: 'mid', childPackId: 'mid.g2' },
        { parentPackId: 'mid.g1', childPackId: 'mid.gg' },
      ]);
      packContentsRepository.find.mockResolvedValue([
        { packId: 'root', contentId: 'c.root' },
        { packId: 'left', contentId: 'c.left' },
        { packId: 'mid', contentId: 'c.mid' },
        { packId: 'right', contentId: 'c.right' },
        { packId: 'mid.g1', contentId: 'c.mid-g1' },
        { packId: 'mid.g2', contentId: 'c.overlap' },
        { packId: 'mid.gg', contentId: 'c.overlap' },
        { packId: 'mid.gg', contentId: 'c.deep' },
      ]);

      const result = await service.getContent('root');
      expect(result.sort()).toEqual([
        'c.deep',
        'c.left',
        'c.mid',
        'c.mid-g1',
        'c.overlap',
        'c.right',
        'c.root',
      ]);
    });

    it('finds leaf content through empty intermediate packs', async () => {
      packsRepository.findOne.mockResolvedValue({ id: 'root', active: true });
      packChildrenRepository.find.mockResolvedValue([
        { parentPackId: 'root', childPackId: 'empty.1' },
        { parentPackId: 'empty.1', childPackId: 'empty.2' },
        { parentPackId: 'empty.2', childPackId: 'leaf' },
      ]);
      packContentsRepository.find.mockResolvedValue([
        { packId: 'leaf', contentId: 'c.leaf' },
      ]);

      await expect(service.getContent('root')).resolves.toEqual(['c.leaf']);
    });

    it('returns only root content when descendants have none', async () => {
      packsRepository.findOne.mockResolvedValue({ id: 'root', active: true });
      packChildrenRepository.find.mockResolvedValue([
        { parentPackId: 'root', childPackId: 'child' },
        { parentPackId: 'child', childPackId: 'grandchild' },
      ]);
      packContentsRepository.find.mockResolvedValue([
        { packId: 'root', contentId: 'c.root' },
      ]);

      await expect(service.getContent('root')).resolves.toEqual(['c.root']);
    });

    it('dedupes identical content ids across many siblings', async () => {
      packsRepository.findOne.mockResolvedValue({ id: 'root', active: true });
      packChildrenRepository.find.mockResolvedValue([
        { parentPackId: 'root', childPackId: 'sib.1' },
        { parentPackId: 'root', childPackId: 'sib.2' },
        { parentPackId: 'root', childPackId: 'sib.3' },
      ]);
      packContentsRepository.find.mockResolvedValue([
        { packId: 'sib.1', contentId: 'c.same' },
        { packId: 'sib.2', contentId: 'c.same' },
        { packId: 'sib.3', contentId: 'c.same' },
        { packId: 'sib.3', contentId: 'c.extra' },
      ]);

      const result = await service.getContent('root');
      expect(result.sort()).toEqual(['c.extra', 'c.same']);
    });
  });
});
