import { DataSource } from 'typeorm';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  let dataSource: { query: ReturnType<typeof vi.fn> };
  let service: HealthService;

  beforeEach(() => {
    dataSource = { query: vi.fn() };
    service = new HealthService(dataSource as unknown as DataSource);
  });

  it('returns ok with app and database up when SELECT 1 succeeds', async () => {
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      info: {
        app: { status: 'up' },
        database: { status: 'up' },
      },
    });
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns error with database down when SELECT 1 fails', async () => {
    dataSource.query.mockRejectedValue(new Error('connection refused'));

    await expect(service.check()).resolves.toEqual({
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

  it('uses a fallback message when the query error has no message', async () => {
    dataSource.query.mockRejectedValue({});

    const result = await service.check();

    expect(result.status).toBe('error');
    expect(result.error?.database.message).toBe('Database unavailable');
  });
});
