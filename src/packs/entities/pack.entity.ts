import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import type { PackChild } from './pack-child.entity.js';
import type { PackContent } from './pack-content.entity.js';

@Entity({ name: 'packs' })
export class Pack {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ name: 'pack_name', type: 'varchar' })
  packName!: string;

  @Column({ type: 'boolean' })
  active!: boolean;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // String relation targets avoid ESM circular init with PackChild/PackContent.
  @OneToMany('PackChild', 'parentPack')
  childLinks!: PackChild[];

  @OneToMany('PackContent', 'pack')
  contents!: PackContent[];
}
