import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { HuntEntity } from '../../hunts/entities/hunt.entity';

@Entity('progress')
export class ProgressEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'uuid' })
  hunt_id: string;

  @ManyToOne(() => HuntEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hunt_id' })
  hunt: HuntEntity;

  @Column({ type: 'int', default: 0 })
  current_step: number;

  @Column({ type: 'int', array: true, default: '{}' })
  completed_steps: number[];

  @Column({ type: 'int', default: 0 })
  total_points: number;

  @CreateDateColumn()
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;
}
