import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PackChild } from '../packs/entities/pack-child.entity.js';
import { PackContent } from '../packs/entities/pack-content.entity.js';
import { Pack } from '../packs/entities/pack.entity.js';
import { resolveDatabaseConfig } from './database.config.js';

const db = resolveDatabaseConfig();

export default new DataSource({
  type: 'postgres',
  host: db.host,
  port: db.port,
  username: db.username,
  password: db.password,
  database: db.database,
  synchronize: false,
  entities: [Pack, PackChild, PackContent],
  migrations: ['src/migrations/*.{ts,js}'],
});
