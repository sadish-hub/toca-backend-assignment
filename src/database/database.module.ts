import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackChild } from '../packs/entities/pack-child.entity.js';
import { PackContent } from '../packs/entities/pack-content.entity.js';
import { Pack } from '../packs/entities/pack.entity.js';
import { resolveDatabaseConfig } from './database.config.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const db = resolveDatabaseConfig({
          DATABASE_HOST: configService.get<string>('DATABASE_HOST'),
          DATABASE_PORT: configService.get<string>('DATABASE_PORT'),
          DATABASE_USER: configService.get<string>('DATABASE_USER'),
          DATABASE_PASSWORD: configService.get<string>('DATABASE_PASSWORD'),
          DATABASE_NAME: configService.get<string>('DATABASE_NAME'),
        });

        return {
          type: 'postgres' as const,
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          entities: [Pack, PackChild, PackContent],
          autoLoadEntities: true,
          synchronize: false,
          retryAttempts: 10,
          retryDelay: 3000,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
