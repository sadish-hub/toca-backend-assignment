export const DATABASE_DEFAULTS = {
  host: 'localhost',
  port: 5432,
  username: 'toca',
  password: 'toca',
  database: 'toca_packs',
} as const;

export type DatabaseConnectionConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

type EnvLike = Record<string, string | undefined>;

export function resolveDatabaseConfig(
  env: EnvLike = process.env,
): DatabaseConnectionConfig {
  const portRaw = env.DATABASE_PORT;
  const port =
    portRaw !== undefined && portRaw !== ''
      ? Number.parseInt(portRaw, 10)
      : DATABASE_DEFAULTS.port;

  return {
    host: env.DATABASE_HOST || DATABASE_DEFAULTS.host,
    port: Number.isFinite(port) ? port : DATABASE_DEFAULTS.port,
    username: env.DATABASE_USER || DATABASE_DEFAULTS.username,
    password: env.DATABASE_PASSWORD || DATABASE_DEFAULTS.password,
    database: env.DATABASE_NAME || DATABASE_DEFAULTS.database,
  };
}
