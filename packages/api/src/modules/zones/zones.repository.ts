import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoneEntity } from './entities/zone.entity';

@Injectable()
export class ZonesRepository {
  constructor(
    @InjectRepository(ZoneEntity)
    private readonly repo: Repository<ZoneEntity>,
  ) {}

  findByHunt(huntId: string): Promise<ZoneEntity[]> {
    return this.repo.find({
      where: { hunt_id: huntId },
      order: { order: 'ASC' },
    });
  }

  findById(id: string): Promise<ZoneEntity | null> {
    return this.repo.findOneBy({ id });
  }

  save(zone: Partial<ZoneEntity>): Promise<ZoneEntity> {
    return this.repo.save(zone);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
