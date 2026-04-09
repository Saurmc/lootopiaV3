import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ZonesRepository } from './zones.repository';
import { HuntsRepository } from '../hunts/hunts.repository';
import { ZoneEntity } from './entities/zone.entity';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(
    private readonly zonesRepository: ZonesRepository,
    private readonly huntsRepository: HuntsRepository,
  ) {}

  findByHunt(huntId: string): Promise<ZoneEntity[]> {
    return this.zonesRepository.findByHunt(huntId);
  }

  async createZone(huntId: string, partnerId: string, dto: CreateZoneDto): Promise<ZoneEntity> {
    const hunt = await this.huntsRepository.findById(huntId);
    if (!hunt) {
      throw new NotFoundException(`Hunt ${huntId} not found`);
    }
    if (hunt.partner_id !== partnerId) {
      throw new ForbiddenException(`You do not own this hunt`);
    }

    return this.zonesRepository.save({
      hunt_id: huntId,
      label: dto.label ?? null,
      shape: dto.shape as any,
      order: dto.order ?? 0,
    });
  }

  async updateZone(
    huntId: string,
    zoneId: string,
    partnerId: string,
    dto: UpdateZoneDto,
  ): Promise<ZoneEntity> {
    const hunt = await this.huntsRepository.findById(huntId);
    if (!hunt) {
      throw new NotFoundException(`Hunt ${huntId} not found`);
    }
    if (hunt.partner_id !== partnerId) {
      throw new ForbiddenException(`You do not own this hunt`);
    }

    const zone = await this.zonesRepository.findById(zoneId);
    if (!zone || zone.hunt_id !== huntId) {
      throw new NotFoundException(`Zone ${zoneId} not found`);
    }

    const updates: Partial<ZoneEntity> = { id: zoneId };
    if (dto.label !== undefined) updates.label = dto.label;
    if (dto.shape !== undefined) updates.shape = dto.shape as any;
    if (dto.order !== undefined) updates.order = dto.order;

    return this.zonesRepository.save(updates);
  }

  async deleteZone(huntId: string, zoneId: string, partnerId: string): Promise<void> {
    const hunt = await this.huntsRepository.findById(huntId);
    if (!hunt) {
      throw new NotFoundException(`Hunt ${huntId} not found`);
    }
    if (hunt.partner_id !== partnerId) {
      throw new ForbiddenException(`You do not own this hunt`);
    }

    const zone = await this.zonesRepository.findById(zoneId);
    if (!zone || zone.hunt_id !== huntId) {
      throw new NotFoundException(`Zone ${zoneId} not found`);
    }

    await this.zonesRepository.deleteById(zoneId);
  }
}
