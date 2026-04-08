import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HuntEntity } from './entities/hunt.entity';

@Injectable()
export class HuntsRepository {
  constructor(
    @InjectRepository(HuntEntity)
    private readonly repo: Repository<HuntEntity>,
  ) {}

  findAll(): Promise<HuntEntity[]> {
    return this.repo.find({ where: { is_active: true } });
  }

  findById(id: string): Promise<HuntEntity | null> {
    return this.repo.findOneBy({ id });
  }

  save(hunt: Partial<HuntEntity>): Promise<HuntEntity> {
    return this.repo.save(hunt);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
