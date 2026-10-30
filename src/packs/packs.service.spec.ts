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
  });
});
