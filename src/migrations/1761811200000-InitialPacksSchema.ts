import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialPacksSchema1761811200000 implements MigrationInterface {
  name = 'InitialPacksSchema1761811200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "packs" (
        "id" character varying NOT NULL,
        "pack_name" character varying NOT NULL,
        "active" boolean NOT NULL,
        "price" numeric(12,2) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_packs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "pack_children" (
        "parent_pack_id" character varying NOT NULL,
        "child_pack_id" character varying NOT NULL,
        CONSTRAINT "PK_pack_children" PRIMARY KEY ("parent_pack_id", "child_pack_id"),
        CONSTRAINT "FK_pack_children_parent" FOREIGN KEY ("parent_pack_id") REFERENCES "packs"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_pack_children_child" FOREIGN KEY ("child_pack_id") REFERENCES "packs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "pack_contents" (
        "pack_id" character varying NOT NULL,
        "content_id" character varying NOT NULL,
        CONSTRAINT "PK_pack_contents" PRIMARY KEY ("pack_id", "content_id"),
        CONSTRAINT "FK_pack_contents_pack" FOREIGN KEY ("pack_id") REFERENCES "packs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "pack_contents"`);
    await queryRunner.query(`DROP TABLE "pack_children"`);
    await queryRunner.query(`DROP TABLE "packs"`);
  }
}
