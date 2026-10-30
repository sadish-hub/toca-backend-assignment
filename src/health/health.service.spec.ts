import { HealthService } from './health.service.js';

describe('HealthService', () => {
  const service = new HealthService();

  it('returns application liveness payload without database fields', () => {
    expect(service.getLiveness()).toEqual({
      status: 'ok',
      info: {
        app: { status: 'up' },
      },
    });
  });
});
