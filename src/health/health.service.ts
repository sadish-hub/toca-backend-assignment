import { Injectable } from '@nestjs/common';

export type HealthLiveness = {
  status: 'ok';
  info: {
    app: {
      status: 'up';
    };
  };
};

@Injectable()
export class HealthService {
  getLiveness(): HealthLiveness {
    return {
      status: 'ok',
      info: {
        app: { status: 'up' },
      },
    };
  }
}
