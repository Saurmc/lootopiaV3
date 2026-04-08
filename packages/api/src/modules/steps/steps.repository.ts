import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StepEntity } from './entities/step.entity';

@Injectable()
export class StepsRepository {
  constructor(
    @InjectRepository(StepEntity)
    private readonly repo: Repository<StepEntity>,
  ) {}

  findById(id: string): Promise<StepEntity | null> {
    return this.repo.findOneBy({ id });
  }

  findByHuntId(huntId: string): Promise<StepEntity[]> {
    return this.repo.find({
      where: { hunt_id: huntId },
      order: { order: 'ASC' },
    });
  }

  save(step: Partial<StepEntity>): Promise<StepEntity> {
    return this.repo.save(step);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
