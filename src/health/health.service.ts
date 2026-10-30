import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export type HealthCheckOk = {
  status: 'ok';
  info: {
    app: { status: 'up' };
    database: { status: 'up' };
  };
};

export type HealthCheckError = {
  status: 'error';
  info: {
    app: { status: 'up' };
    database: { status: 'down' };
  };
  error: {
    database: {
      status: 'down';
      message: string;
    };
  };
};

export type HealthCheckResult = HealthCheckOk | HealthCheckError;

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async check(): Promise<HealthCheckResult> {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        info: {
          app: { status: 'up' },
          database: { status: 'up' },
        },
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Database unavailable';

      return {
        status: 'error',
        info: {
          app: { status: 'up' },
          database: { status: 'down' },
        },
        error: {
          database: {
            status: 'down',
            message,
          },
        },
      };
    }
  }
}
