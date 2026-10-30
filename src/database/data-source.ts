import 'reflect-metadata';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { PackChild } from '../packs/entities/pack-child.entity.js';
import { PackContent } from '../packs/entities/pack-content.entity.js';
import { Pack } from '../packs/entities/pack.entity.js';
import { resolveDatabaseConfig } from './database.config.js';

const db = resolveDatabaseConfig();

/** Resolve next to this file so CLI (src/) and Docker (dist/) both find migrations. */
const migrationsGlob = join(
  dirname(fileURLToPath(import.meta.url)),
  '../migrations/*.{ts,js}',
);

export default new DataSource({
  type: 'postgres',
  host: db.host,
  port: db.port,
  username: db.username,
  password: db.password,
  database: db.database,
  synchronize: false,
  entities: [Pack, PackChild, PackContent],
  migrations: [migrationsGlob],
});
