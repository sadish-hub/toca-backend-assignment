import {
  DATABASE_DEFAULTS,
  resolveDatabaseConfig,
} from './database.config.js';

describe('resolveDatabaseConfig', () => {
  it('uses documented defaults when env is empty', () => {
    expect(resolveDatabaseConfig({})).toEqual({
      host: DATABASE_DEFAULTS.host,
      port: DATABASE_DEFAULTS.port,
      username: DATABASE_DEFAULTS.username,
      password: DATABASE_DEFAULTS.password,
      database: DATABASE_DEFAULTS.database,
    });
    expect(DATABASE_DEFAULTS).toEqual({
      host: 'localhost',
      port: 5432,
      username: 'toca',
      password: 'toca',
      database: 'toca_packs',
    });
  });

  it('reads DATABASE_* env keys when provided', () => {
    expect(
      resolveDatabaseConfig({
        DATABASE_HOST: 'db',
        DATABASE_PORT: '5433',
        DATABASE_USER: 'reviewer',
        DATABASE_PASSWORD: 'secret',
        DATABASE_NAME: 'packs',
      }),
    ).toEqual({
      host: 'db',
      port: 5433,
      username: 'reviewer',
      password: 'secret',
      database: 'packs',
    });
  });
});
