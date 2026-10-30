import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Pack } from './pack.entity.js';

@Entity({ name: 'pack_children' })
export class PackChild {
  @PrimaryColumn({ name: 'parent_pack_id', type: 'varchar' })
  parentPackId!: string;

  @PrimaryColumn({ name: 'child_pack_id', type: 'varchar' })
  childPackId!: string;

  @ManyToOne(() => Pack, (pack) => pack.childLinks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_pack_id' })
  parentPack!: Pack;

  @ManyToOne(() => Pack, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'child_pack_id' })
  childPack!: Pack;
}
