import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HuntEntity } from '../../hunts/entities/hunt.entity';

export interface ZoneShape {
  type: 'rect' | 'circle' | 'polygon';
  // rect
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // circle
  cx?: number;
  cy?: number;
  radius?: number;
  // polygon
  points?: Array<{ x: number; y: number }>;
}

@Entity('zones')
export class ZoneEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  hunt_id: string;

  @ManyToOne(() => HuntEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hunt_id' })
  hunt: HuntEntity;

  @Column({ type: 'varchar', nullable: true })
  label: string | null;

  // Forme de la zone en coordonnées pixel sur le plan uploadé
  @Column({ type: 'jsonb' })
  shape: ZoneShape;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn()
  created_at: Date;
}
