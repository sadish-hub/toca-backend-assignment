import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Pack } from './pack.entity.js';

@Entity({ name: 'pack_contents' })
export class PackContent {
  @PrimaryColumn({ name: 'pack_id', type: 'varchar' })
  packId!: string;

  @PrimaryColumn({ name: 'content_id', type: 'varchar' })
  contentId!: string;

  @ManyToOne(() => Pack, (pack) => pack.contents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pack_id' })
  pack!: Pack;
}
