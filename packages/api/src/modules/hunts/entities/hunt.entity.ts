import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { StepEntity } from '../../steps/entities/step.entity';

@Entity('hunts')
export class HuntEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: UserEntity;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  // Coordonnées GPS de la chasse pour l'affichage sur carte (PostGIS)
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  coordinates: object | null;

  @Column({ type: 'varchar', nullable: true })
  difficulty: string | null;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  // URL du plan ou de l'image associée à la chasse (uploadée via POST /files/upload)
  @Column({ type: 'varchar', nullable: true })
  image_url: string | null;

  @OneToMany(() => StepEntity, (step) => step.hunt)
  steps: StepEntity[];

  @CreateDateColumn()
  created_at: Date;
}
