import { Injectable, NotFoundException } from '@nestjs/common';
import { HuntsRepository } from './hunts.repository';
import { HuntEntity } from './entities/hunt.entity';
import { GeoService, NearbyHuntRow } from '../geo/geo.service';
import { HuntDetailDto } from './dto/hunt-detail.dto';

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

  async getDetail(id: string): Promise<HuntDetailDto> {
    const hunt = await this.huntsRepository.findByIdWithSteps(id);
    if (!hunt) {
      throw new NotFoundException(`Hunt ${id} not found`);
    }
    return {
      id: hunt.id,
      title: hunt.title,
      description: hunt.description,
      location: hunt.location,
      difficulty: hunt.difficulty,
      duration: hunt.duration,
      points: hunt.points,
      is_active: hunt.is_active,
      step_count: hunt.steps?.length ?? 0,
      steps: (hunt.steps ?? []).map((s) => ({
        id: s.id,
        order: s.order,
        title: s.title,
        description: s.description,
        validation_radius: s.validation_radius,
        ar_content: s.ar_content,
      })),
      created_at: hunt.created_at,
    };
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
