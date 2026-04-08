import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgressEntity } from './entities/progress.entity';

@Injectable()
export class ProgressRepository {
  constructor(
    @InjectRepository(ProgressEntity)
    private readonly repo: Repository<ProgressEntity>,
  ) {}

  findByUserAndHunt(userId: string, huntId: string): Promise<ProgressEntity | null> {
    return this.repo.findOneBy({ user_id: userId, hunt_id: huntId });
  }

  findAllByUser(userId: string): Promise<ProgressEntity[]> {
    return this.repo.find({ where: { user_id: userId } });
  }

  findAllByHunt(huntId: string): Promise<ProgressEntity[]> {
    return this.repo.find({ where: { hunt_id: huntId } });
  }

  save(progress: Partial<ProgressEntity>): Promise<ProgressEntity> {
    return this.repo.save(progress);
  }
}
