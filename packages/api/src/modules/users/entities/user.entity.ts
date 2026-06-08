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

  // Modération admin : compte suspendu (bloque login + accès backoffice)
  @Column({ type: 'boolean', default: false })
  is_blocked: boolean;

  // Pseudo affiché dans l'app (nullable : facultatif pour les invités)
  @Column({ type: 'varchar', length: 50, nullable: true })
  pseudo: string | null;

  // Incrémenté à chaque logout ou changement de mot de passe — invalide tous les refresh tokens existants
  @Column({ type: 'int', default: 1 })
  refresh_token_version: number;

  // URL de la photo de profil (stockée via /files/upload)
  @Column({ type: 'varchar', nullable: true })
  avatar_url: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
