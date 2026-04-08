import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadgeEntity } from './entities/badge.entity';

@Injectable()
export class BadgesRepository {
  constructor(
    @InjectRepository(BadgeEntity)
    private readonly repo: Repository<BadgeEntity>,
  ) {}

  findByUser(userId: string): Promise<BadgeEntity[]> {
    return this.repo.find({ where: { user_id: userId }, order: { earned_at: 'DESC' } });
  }

  findByUserAndType(userId: string, badgeType: string): Promise<BadgeEntity | null> {
    return this.repo.findOneBy({ user_id: userId, badge_type: badgeType });
  }

  save(badge: Partial<BadgeEntity>): Promise<BadgeEntity> {
    return this.repo.save(badge);
  }
}
