import type { Server } from 'node:http';
import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: getDataSourceToken(),
          useValue: { query: vi.fn().mockResolvedValue([{ '?column?': 1 }]) },
        },
      ],
    }).compile();

    controller = module.get(HealthController);
    service = module.get(HealthService);
  });

  it('returns health payload when check status is ok', async () => {
    const payload = {
      status: 'ok' as const,
      info: {
        app: { status: 'up' as const },
        database: { status: 'up' as const },
      },
    };
    const check = vi.spyOn(service, 'check').mockResolvedValue(payload);

    await expect(controller.getHealth()).resolves.toEqual(payload);
    expect(check).toHaveBeenCalledOnce();
  });

  it('throws ServiceUnavailableException when check status is error', async () => {
    const payload = {
      status: 'error' as const,
      info: {
        app: { status: 'up' as const },
        database: { status: 'down' as const },
      },
      error: {
        database: {
          status: 'down' as const,
          message: 'connection refused',
        },
      },
    };
    vi.spyOn(service, 'check').mockResolvedValue(payload);

    await expect(controller.getHealth()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(controller.getHealth()).rejects.toMatchObject({
      response: payload,
    });
  });
});

describe('GET /health (HTTP)', () => {
  let app: INestApplication;
  let query: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    query = vi.fn();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: DataSource,
          useValue: { query },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 200 with app and database up when DB is reachable', async () => {
    query.mockResolvedValue([{ '?column?': 1 }]);
    const server = app.getHttpServer() as Server;

    await request(server)
      .get('/health')
      .expect(200)
      .expect({
        status: 'ok',
        info: {
          app: { status: 'up' },
          database: { status: 'up' },
        },
      });
  });

  it('returns 503 with database down when DB ping fails', async () => {
    query.mockRejectedValue(new Error('connection refused'));
    const server = app.getHttpServer() as Server;

    const response = await request(server).get('/health').expect(503);

    expect(response.body).toEqual({
      status: 'error',
      info: {
        app: { status: 'up' },
        database: { status: 'down' },
      },
      error: {
        database: {
          status: 'down',
          message: 'connection refused',
        },
      },
    });
  });
});
