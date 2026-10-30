import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    controller = module.get(HealthController);
    service = module.get(HealthService);
  });

  it('delegates to HealthService.getLiveness()', () => {
    const payload = {
      status: 'ok' as const,
      info: { app: { status: 'up' as const } },
    };
    const getLiveness = vi.spyOn(service, 'getLiveness').mockReturnValue(payload);

    expect(controller.getHealth()).toEqual(payload);
    expect(getLiveness).toHaveBeenCalledOnce();
  });
});

describe('GET /health (HTTP)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 200 with app-up liveness payload', async () => {
    const server = app.getHttpServer() as Server;
    await request(server)
      .get('/health')
      .expect(200)
      .expect({
        status: 'ok',
        info: {
          app: { status: 'up' },
        },
      });
  });
});
