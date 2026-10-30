import { DataSource } from 'typeorm';
import { PackChild } from './pack-child.entity.js';
import { PackContent } from './pack-content.entity.js';
import { Pack } from './pack.entity.js';

describe('Pack entities metadata', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      database: 'metadata_only',
      entities: [Pack, PackChild, PackContent],
      synchronize: false,
    });
    await dataSource.buildMetadatas();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('maps Pack to packs with Architecture columns', () => {
    const meta = dataSource.getMetadata(Pack);
    expect(meta.tableName).toBe('packs');

    const columns = Object.fromEntries(
      meta.columns.map((c) => [c.propertyName, c.databaseName]),
    );
    expect(columns).toMatchObject({
      id: 'id',
      packName: 'pack_name',
      active: 'active',
      price: 'price',
      createdAt: 'created_at',
    });
    expect(meta.columns.find((c) => c.propertyName === 'id')?.isPrimary).toBe(
      true,
    );
    expect(meta.columns.find((c) => c.propertyName === 'price')?.type).toBe(
      'numeric',
    );
    expect(
      meta.columns.find((c) => c.propertyName === 'createdAt')?.type,
    ).toBe('timestamptz');
  });

  it('maps PackChild to pack_children with unique parent/child FKs', () => {
    const meta = dataSource.getMetadata(PackChild);
    expect(meta.tableName).toBe('pack_children');

    const columns = Object.fromEntries(
      meta.columns.map((c) => [c.propertyName, c.databaseName]),
    );
    expect(columns).toMatchObject({
      parentPackId: 'parent_pack_id',
      childPackId: 'child_pack_id',
    });

    const primary = meta.primaryColumns.map((c) => c.databaseName).sort();
    expect(primary).toEqual(['child_pack_id', 'parent_pack_id']);

    const fkColumns = meta.foreignKeys.flatMap((fk) =>
      fk.columnNames.map((name, i) => ({
        column: name,
        referenced: fk.referencedColumnNames[i],
        onDelete: fk.onDelete,
      })),
    );
    expect(fkColumns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          column: 'parent_pack_id',
          referenced: 'id',
          onDelete: 'CASCADE',
        }),
        expect.objectContaining({
          column: 'child_pack_id',
          referenced: 'id',
          onDelete: 'CASCADE',
        }),
      ]),
    );
  });

  it('maps PackContent to pack_contents with unique pack/content pair', () => {
    const meta = dataSource.getMetadata(PackContent);
    expect(meta.tableName).toBe('pack_contents');

    const columns = Object.fromEntries(
      meta.columns.map((c) => [c.propertyName, c.databaseName]),
    );
    expect(columns).toMatchObject({
      packId: 'pack_id',
      contentId: 'content_id',
    });

    const primary = meta.primaryColumns.map((c) => c.databaseName).sort();
    expect(primary).toEqual(['content_id', 'pack_id']);

    expect(meta.foreignKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          columnNames: ['pack_id'],
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      ]),
    );
  });
});
