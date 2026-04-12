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

  findByPartner(partnerId: string): Promise<HuntEntity[]> {
    return this.repo.find({
      where: { partner_id: partnerId },
      order: { created_at: 'DESC' },
    });
  }

  count(): Promise<number> {
    return this.repo.count();
  }

  findAllForStats(partnerId?: string): Promise<HuntEntity[]> {
    return partnerId
      ? this.repo.find({ where: { partner_id: partnerId } })
      : this.repo.find();
  }

  search(q: string): Promise<HuntEntity[]> {
    const term = `%${q.toLowerCase()}%`;
    return this.repo
      .createQueryBuilder('hunt')
      .where('hunt.is_active = true')
      .andWhere(
        '(LOWER(hunt.title) LIKE :term OR LOWER(hunt.description) LIKE :term)',
        { term },
      )
      .getMany();
  }

  searchByPartner(q: string, partnerId: string): Promise<HuntEntity[]> {
    const term = `%${q.toLowerCase()}%`;
    return this.repo
      .createQueryBuilder('hunt')
      .where('hunt.partner_id = :partnerId', { partnerId })
      .andWhere(
        '(LOWER(hunt.title) LIKE :term OR LOWER(hunt.description) LIKE :term)',
        { term },
      )
      .orderBy('hunt.created_at', 'DESC')
      .getMany();
  }

  findById(id: string): Promise<HuntEntity | null> {
    return this.repo.findOneBy({ id });
  }

  findByIdWithSteps(id: string): Promise<HuntEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['steps'],
      order: { steps: { order: 'ASC' } },
    });
  }

  save(hunt: Partial<HuntEntity>): Promise<HuntEntity> {
    return this.repo.save(hunt);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
