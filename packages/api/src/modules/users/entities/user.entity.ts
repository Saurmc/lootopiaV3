import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  password_hash: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.PLAYER })
  role: Role;

  // Compte invité : identifiant unique de l'appareil mobile (UUID généré côté app)
  @Column({ type: 'varchar', unique: true, nullable: true })
  device_token: string | null;

  // true = compte invité (sans email/password), false = compte complet
  @Column({ type: 'boolean', default: true })
  is_guest: boolean;

  // RGPD : consentement GPS obligatoire avant toute géolocalisation
  @Column({ type: 'boolean', default: false })
  consent_gps: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
