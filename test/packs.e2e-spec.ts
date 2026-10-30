import type { Server } from 'node:http';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';

describe('PacksController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE TABLE pack_contents, pack_children, packs RESTART IDENTITY CASCADE',
    );
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.query(
        'TRUNCATE TABLE pack_contents, pack_children, packs RESTART IDENTITY CASCADE',
      );
    }
    if (app) {
      await app.close();
    }
  });

  const server = (): Server => app.getHttpServer() as Server;

  it('POST /packs creates a pack; GET /packs lists it', async () => {
    const createRes = await request(server())
      .post('/packs')
      .send({
        id: 'pack.classroom',
        packName: 'Classroom',
        active: true,
        price: 5,
        content: ['desk.student'],
      })
      .expect(201);

    expect(createRes.body).toMatchObject({
      id: 'pack.classroom',
      packName: 'Classroom',
      active: true,
      price: 5,
      content: ['desk.student'],
      childPackIds: [],
    });

    const listRes = await request(server()).get('/packs').expect(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0]).toMatchObject({
      id: 'pack.classroom',
      childPackIds: [],
      content: ['desk.student'],
    });
  });

  it('GET /packs/:id/content returns flat unique nested content', async () => {
    await request(server())
      .post('/packs')
      .send({
        id: 'pack.playground',
        packName: 'Playground',
        active: true,
        price: 3,
        content: ['swing.set'],
      })
      .expect(201);

    await request(server())
      .post('/packs')
      .send({
        id: 'pack.classroom',
        packName: 'Classroom',
        active: false,
        price: 4,
        content: ['desk.student', 'swing.set'],
      })
      .expect(201);

    await request(server())
      .post('/packs')
      .send({
        id: 'pack.school',
        packName: 'The School Pack',
        active: true,
        price: 10,
        content: ['furniture.whiteboard'],
        childPackIds: ['pack.classroom', 'pack.playground'],
      })
      .expect(201);

    const contentRes = await request(server())
      .get('/packs/pack.school/content')
      .expect(200);

    expect(contentRes.body.sort()).toEqual(
      ['desk.student', 'furniture.whiteboard', 'swing.set'].sort(),
    );
  });

  it('GET /packs/:id/content aggregates a 5-level chain with an overlapping content id', async () => {
    // Leaf → … → root: e → d → c → b → a (create children before parents)
    await request(server())
      .post('/packs')
      .send({
        id: 'pack.e',
        packName: 'Level E',
        active: true,
        price: 1,
        content: ['c.shared', 'c.e-only'],
      })
      .expect(201);

    await request(server())
      .post('/packs')
      .send({
        id: 'pack.d',
        packName: 'Level D',
        active: true,
        price: 1,
        content: ['c.d'],
        childPackIds: ['pack.e'],
      })
      .expect(201);

    await request(server())
      .post('/packs')
      .send({
        id: 'pack.c',
        packName: 'Level C',
        active: true,
        price: 1,
        content: ['c.c'],
        childPackIds: ['pack.d'],
      })
      .expect(201);

    await request(server())
      .post('/packs')
      .send({
        id: 'pack.b',
        packName: 'Level B',
        active: false,
        price: 1,
        content: ['c.b'],
        childPackIds: ['pack.c'],
      })
      .expect(201);

    await request(server())
      .post('/packs')
      .send({
        id: 'pack.a',
        packName: 'Level A',
        active: true,
        price: 5,
        content: ['c.shared', 'c.a-only'],
        childPackIds: ['pack.b'],
      })
      .expect(201);

    const contentRes = await request(server())
      .get('/packs/pack.a/content')
      .expect(200);

    expect(contentRes.body.sort()).toEqual(
      ['c.a-only', 'c.b', 'c.c', 'c.d', 'c.e-only', 'c.shared'].sort(),
    );
    expect(contentRes.body.filter((id: string) => id === 'c.shared')).toHaveLength(
      1,
    );
  });

  it('GET /packs/:id/content handles wide+deep mix and empty intermediate nodes', async () => {
    // deep leaf under mid branch; empty intermediates on left branch
    await request(server())
      .post('/packs')
      .send({
        id: 'pack.mid.gg',
        packName: 'Mid Great-Grandchild',
        active: true,
        price: 1,
        content: ['c.deep', 'c.overlap'],
      })
      .expect(201);

    await request(server())
      .post('/packs')
      .send({
        id: 'pack.mid.g1',
        packName: 'Mid Grandchild 1',
        active: true,
        price: 1,
        content: ['c.mid-g1'],
        childPackIds: ['pack.mid.gg'],
      })
      .expect(201);

    await request(server())
      .post('/packs')
      .send({
        id: 'pack.mid.g2',
        packName: 'Mid Grandchild 2',
        active: true,
        price: 1,
        content: ['c.overlap'],
      })
      .expect(201);

    await request(server())
      .post('/packs')
      .send({
        id: 'pack.mid',
        packName: 'Mid',
        active: true,
        price: 1,
        content: ['c.mid'],
        childPackIds: ['pack.mid.g1', 'pack.mid.g2'],
      })
      .expect(201);

    await request(server())
      .post('/packs')
      .send({
        id: 'pack.left.leaf',
        packName: 'Left Leaf',
        active: true,
        price: 1,
        content: ['c.left-leaf'],
      })
      .expect(201);

    await request(server())
      .post('/packs')
      .send({
        id: 'pack.left.empty',
        packName: 'Left Empty',
        active: true,
        price: 1,
        childPackIds: ['pack.left.leaf'],
      })
      .expect(201);

    await request(server())
      .post('/packs')
      .send({
        id: 'pack.right',
        packName: 'Right',
        active: true,
        price: 1,
        content: ['c.right'],
      })
      .expect(201);

    await request(server())
      .post('/packs')
      .send({
        id: 'pack.root',
        packName: 'Root',
        active: true,
        price: 10,
        content: ['c.root'],
        childPackIds: ['pack.left.empty', 'pack.mid', 'pack.right'],
      })
      .expect(201);

    const contentRes = await request(server())
      .get('/packs/pack.root/content')
      .expect(200);

    expect(contentRes.body.sort()).toEqual(
      [
        'c.deep',
        'c.left-leaf',
        'c.mid',
        'c.mid-g1',
        'c.overlap',
        'c.right',
        'c.root',
      ].sort(),
    );
  });

  it('GET /packs/:id/content returns 404 for a missing pack', async () => {
    await request(server()).get('/packs/pack.missing/content').expect(404);
  });

  it('POST /packs returns 409 for a duplicate id', async () => {
    const body = {
      id: 'pack.dup',
      packName: 'Dup',
      active: true,
      price: 1,
    };
    await request(server()).post('/packs').send(body).expect(201);
    await request(server()).post('/packs').send(body).expect(409);
  });

  it('POST /packs returns 400 for unknown childPackIds', async () => {
    await request(server())
      .post('/packs')
      .send({
        id: 'pack.parent',
        packName: 'Parent',
        active: true,
        price: 1,
        childPackIds: ['pack.does-not-exist'],
      })
      .expect(400);
  });

  it('POST /packs returns 400 for self-reference', async () => {
    await request(server())
      .post('/packs')
      .send({
        id: 'pack.self',
        packName: 'Self',
        active: true,
        price: 1,
        childPackIds: ['pack.self'],
      })
      .expect(400);
  });

  it('POST /packs returns 400 for invalid body', async () => {
    await request(server())
      .post('/packs')
      .send({ id: '', packName: 'X', active: true, price: 1 })
      .expect(400);
  });

  it('POST /packs returns 400 for empty-string content ids', async () => {
    await request(server())
      .post('/packs')
      .send({
        id: 'pack.empty-content',
        packName: 'Empty Content',
        active: true,
        price: 1,
        content: [''],
      })
      .expect(400);
  });

  it('POST /packs returns 400 for empty-string childPackIds', async () => {
    await request(server())
      .post('/packs')
      .send({
        id: 'pack.empty-child',
        packName: 'Empty Child',
        active: true,
        price: 1,
        childPackIds: [''],
      })
      .expect(400);
  });

  it('omitting childPackIds is allowed', async () => {
    await request(server())
      .post('/packs')
      .send({
        id: 'pack.solo',
        packName: 'Solo',
        active: true,
        price: 2,
      })
      .expect(201);

    const listRes = await request(server()).get('/packs').expect(200);
    expect(listRes.body[0].childPackIds).toEqual([]);
  });
});
