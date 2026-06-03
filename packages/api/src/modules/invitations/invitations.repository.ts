import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvitationEntity } from './entities/invitation.entity';

@Injectable()
export class InvitationsRepository {
  constructor(
    @InjectRepository(InvitationEntity)
    private readonly repo: Repository<InvitationEntity>,
  ) {}

  save(data: Partial<InvitationEntity>): Promise<InvitationEntity> {
    return this.repo.save(data);
  }

  findByToken(token: string): Promise<InvitationEntity | null> {
    return this.repo.findOneBy({ token });
  }

  findByEmail(email: string): Promise<InvitationEntity | null> {
    return this.repo.findOne({ where: { email }, order: { created_at: 'DESC' } });
  }

  findAll(): Promise<InvitationEntity[]> {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }
}
