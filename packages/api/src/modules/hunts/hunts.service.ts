import { Injectable, NotFoundException } from '@nestjs/common';
import { HuntsRepository } from './hunts.repository';
import { HuntEntity } from './entities/hunt.entity';
import { GeoService, NearbyHuntRow } from '../geo/geo.service';

const DEFAULT_RADIUS_METERS = 5000;

@Injectable()
export class HuntsService {
  constructor(
    private readonly huntsRepository: HuntsRepository,
    private readonly geoService: GeoService,
  ) {}

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

  search(q: string): Promise<HuntEntity[]> {
    return this.huntsRepository.search(q);
  }

  findNearby(
    lat: number,
    lng: number,
    radius: number = DEFAULT_RADIUS_METERS,
  ): Promise<NearbyHuntRow[]> {
    return this.geoService.findHuntsNearby(lat, lng, radius);
  }
}
