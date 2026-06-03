import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('invitations')
export class InvitationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar', unique: true })
  token: string;

  @Column({ type: 'varchar', nullable: true })
  partner_name: string | null;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  used_at: Date | null;

  @Column({ type: 'uuid' })
  created_by_id: string;

  @CreateDateColumn()
  created_at: Date;
}
