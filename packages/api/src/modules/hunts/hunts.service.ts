import { Injectable, NotFoundException } from '@nestjs/common';
import { HuntsRepository } from './hunts.repository';
import { HuntEntity } from './entities/hunt.entity';

@Injectable()
export class HuntsService {
  constructor(private readonly huntsRepository: HuntsRepository) {}

  findAll(): Promise<HuntEntity[]> {
    return this.huntsRepository.findAll();
  }

  async findById(id: string): Promise<HuntEntity> {
    const hunt = await this.huntsRepository.findById(id);
    if (!hunt) {
      throw new NotFoundException(`Hunt ${id} not found`);
    }
    return hunt;
  }
}
