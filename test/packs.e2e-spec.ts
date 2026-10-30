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
    await app.close();
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
