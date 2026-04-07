import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HuntEntity } from '../../hunts/entities/hunt.entity';

@Entity('steps')
export class StepEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  hunt_id: string;

  @ManyToOne(() => HuntEntity, (hunt) => hunt.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hunt_id' })
  hunt: HuntEntity;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // PostGIS GEOGRAPHY(Point, 4326) — coordonnées géographiques de l'étape
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: object | null;

  // Rayon en mètres pour la validation de proximité
  @Column({ type: 'int', default: 50 })
  validation_radius: number;

  @Column({ type: 'jsonb', nullable: true })
  ar_content: Record<string, unknown> | null;

  @CreateDateColumn()
  created_at: Date;
}
