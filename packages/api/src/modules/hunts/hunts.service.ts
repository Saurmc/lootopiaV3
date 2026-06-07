import { Injectable, NotFoundException } from '@nestjs/common';
import { HuntsRepository } from './hunts.repository';
import { HuntEntity } from './entities/hunt.entity';
import { GeoService, NearbyHuntRow } from '../geo/geo.service';
import { HuntDetailDto } from './dto/hunt-detail.dto';
import { CreateHuntDto } from './dto/create-hunt.dto';
import { UpdateHuntDto } from './dto/update-hunt.dto';
import { ProgressRepository } from '../progress/progress.repository';
import { HUNT_TEMPLATES, HuntTemplate } from './hunt-templates.constants';
import { StorageService } from '../files/storage.service';

export interface ParticipantDto {
  user_id: string;
  email: string | null;
  current_step: number;
  completed_steps: number[];
  total_points: number;
  started_at: Date;
  completed_at: Date | null;
}

export interface HuntStatsDto {
  hunt_id: string;
  participant_count: number;
  completed_count: number;
  completion_rate: number;
  average_points: number;
}

const DEFAULT_RADIUS_METERS = 5000;

@Injectable()
export class HuntsService {
  constructor(
    private readonly huntsRepository: HuntsRepository,
    private readonly geoService: GeoService,
    private readonly progressRepository: ProgressRepository,
    private readonly storageService: StorageService,
  ) {}

  private extractThumbnail(ac: Record<string, unknown> | null): string | null {
    if (!ac) return null;
    if (ac.type === 'ar-3d-spatial') {
      const img = ac.marker_image ?? ac.artwork_image;
      return typeof img === 'string' ? img : null;
    }
    if (ac.type === '2d-overlay') {
      return typeof ac.image === 'string' ? ac.image : null;
    }
    return null;
  }

  getTemplates(): HuntTemplate[] {
    return HUNT_TEMPLATES;
  }

  async createHuntFromTemplate(partnerId: string, templateId: string): Promise<HuntEntity> {
    const template = HUNT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }
    return this.huntsRepository.save({
      partner_id: partnerId,
      title: template.defaults.title,
      description: template.defaults.description,
      difficulty: template.defaults.difficulty,
      duration: template.defaults.duration,
      points: template.defaults.points,
      location: null,
      coordinates: null,
      is_active: false,
    });
  }

  createHunt(partnerId: string, dto: CreateHuntDto): Promise<HuntEntity> {
    const coordinates =
      dto.lat !== undefined && dto.lng !== undefined
        ? { type: 'Point', coordinates: [dto.lng, dto.lat] }
        : null;

    return this.huntsRepository.save({
      partner_id: partnerId,
      title: dto.title,
      description: dto.description ?? null,
      location: dto.location ?? null,
      coordinates,
      difficulty: dto.difficulty ?? null,
      duration: dto.duration ?? null,
      points: dto.points ?? 0,
      is_active: dto.is_active ?? false,
      image_url: dto.image_url ?? null,
    });
  }

  async updateHunt(
    huntId: string,
    partnerId: string,
    dto: UpdateHuntDto,
  ): Promise<HuntEntity> {
    const hunt = await this.huntsRepository.findById(huntId);
    if (!hunt) {
      throw new NotFoundException(`Hunt ${huntId} not found`);
    }
    if (hunt.partner_id !== partnerId) {
      throw new NotFoundException(`Hunt ${huntId} not found`);
    }

    const updates: Partial<HuntEntity> = { id: huntId };
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.location !== undefined) updates.location = dto.location;
    if (dto.difficulty !== undefined) updates.difficulty = dto.difficulty;
    if (dto.duration !== undefined) updates.duration = dto.duration;
    if (dto.points !== undefined) updates.points = dto.points;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.image_url !== undefined) updates.image_url = dto.image_url;
    if (dto.lat !== undefined && dto.lng !== undefined) {
      updates.coordinates = { type: 'Point', coordinates: [dto.lng, dto.lat] } as any;
    }

    return this.huntsRepository.save(updates);
  }

  async getStats(huntId: string, partnerId: string): Promise<HuntStatsDto> {
    const hunt = await this.huntsRepository.findById(huntId);
    if (!hunt) {
      throw new NotFoundException(`Hunt ${huntId} not found`);
    }
    if (hunt.partner_id !== partnerId) {
      throw new NotFoundException(`Hunt ${huntId} not found`);
    }

    const progresses = await this.progressRepository.findAllByHunt(huntId);
    const participant_count = progresses.length;
    const completed = progresses.filter((p) => p.completed_at !== null);
    const completed_count = completed.length;
    const completion_rate =
      participant_count > 0
        ? Math.round((completed_count / participant_count) * 100)
        : 0;
    const average_points =
      participant_count > 0
        ? Math.round(progresses.reduce((sum, p) => sum + p.total_points, 0) / participant_count)
        : 0;

    return { hunt_id: huntId, participant_count, completed_count, completion_rate, average_points };
  }

  async getParticipants(huntId: string, partnerId: string): Promise<ParticipantDto[]> {
    const hunt = await this.huntsRepository.findById(huntId);
    if (!hunt) {
      throw new NotFoundException(`Hunt ${huntId} not found`);
    }
    if (hunt.partner_id !== partnerId) {
      throw new NotFoundException(`Hunt ${huntId} not found`);
    }

    const progresses = await this.progressRepository.findAllByHuntWithUser(huntId);
    return progresses.map((p) => ({
      user_id: p.user_id,
      email: p.user?.email ?? null,
      current_step: p.current_step,
      completed_steps: p.completed_steps,
      total_points: p.total_points,
      started_at: p.started_at,
      completed_at: p.completed_at,
    }));
  }

  async deleteHunt(huntId: string, partnerId: string): Promise<void> {
    const hunt = await this.huntsRepository.findById(huntId);
    if (!hunt) {
      throw new NotFoundException(`Hunt ${huntId} not found`);
    }
    if (hunt.partner_id !== partnerId) {
      throw new NotFoundException(`Hunt ${huntId} not found`);
    }
    await this.huntsRepository.deleteById(huntId);
  }

  findAll(): Promise<HuntEntity[]> {
    return this.huntsRepository.findAll();
  }

  findAllForPartner(partnerId: string): Promise<HuntEntity[]> {
    return this.huntsRepository.findByPartner(partnerId);
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
      image_url: hunt.image_url ?? null,
      step_count: hunt.steps?.length ?? 0,
      steps: await Promise.all((hunt.steps ?? []).map(async (s) => {
        const resolved = s.ar_content
          ? await this.storageService.rewriteArContentUrls(s.ar_content)
          : null;
        return {
          id: s.id,
          order: s.order,
          title: s.title,
          description: s.description,
          validation_radius: s.validation_radius,
          thumbnail: this.extractThumbnail(resolved),
          ar_content: resolved,
        };
      })),
      created_at: hunt.created_at,
    };
  }

  search(q: string): Promise<HuntEntity[]> {
    return this.huntsRepository.search(q);
  }

  searchForPartner(q: string, partnerId: string): Promise<HuntEntity[]> {
    return this.huntsRepository.searchByPartner(q, partnerId);
  }

  findNearby(
    lat: number,
    lng: number,
    radius: number = DEFAULT_RADIUS_METERS,
  ): Promise<NearbyHuntRow[]> {
    return this.geoService.findHuntsNearby(lat, lng, radius);
  }
}
