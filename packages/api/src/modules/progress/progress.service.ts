import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProgressRepository } from './progress.repository';
import { HuntsRepository } from '../hunts/hunts.repository';
import { UsersRepository } from '../users/users.repository';
import { ProgressEntity } from './entities/progress.entity';
import { ProgressMapDto, StepMapDto, StepStatus } from './dto/progress-map.dto';

@Injectable()
export class ProgressService {
  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly huntsRepository: HuntsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async joinHunt(userId: string, huntId: string): Promise<ProgressEntity> {
    const hunt = await this.huntsRepository.findById(huntId);
    if (!hunt || !hunt.is_active) {
      throw new NotFoundException(`Hunt ${huntId} not found or inactive`);
    }

    const existing = await this.progressRepository.findByUserAndHunt(userId, huntId);
    if (existing) {
      throw new ConflictException('Already joined this hunt');
    }

    return this.progressRepository.save({
      user_id: userId,
      hunt_id: huntId,
      current_step: 0,
      completed_steps: [],
      total_points: 0,
    });
  }

  async getProgress(userId: string, huntId: string): Promise<ProgressEntity> {
    const progress = await this.progressRepository.findByUserAndHunt(userId, huntId);
    if (!progress) {
      throw new NotFoundException('No progress found for this hunt');
    }
    return progress;
  }

  async getProgressWithSteps(userId: string, huntId: string): Promise<ProgressMapDto> {
    const progress = await this.progressRepository.findByUserAndHunt(userId, huntId);
    if (!progress) {
      throw new NotFoundException('No progress found for this hunt');
    }

    const hunt = await this.huntsRepository.findByIdWithSteps(huntId);
    if (!hunt) {
      throw new NotFoundException(`Hunt ${huntId} not found`);
    }

    // Vérification du consentement GPS pour exposer les coordonnées
    const user = await this.usersRepository.findById(userId);
    const hasGpsConsent = user?.consent_gps ?? false;

    const steps: StepMapDto[] = (hunt.steps ?? []).map((step) => {
      const isCompleted = progress.completed_steps.includes(step.order);
      const isCurrent = step.order === progress.current_step;

      let status: StepStatus = 'locked';
      if (isCompleted) status = 'completed';
      else if (isCurrent) status = 'current';

      // Coordonnées exposées seulement pour étapes complétées/courantes ET consentement GPS
      let coordinates: { lat: number; lng: number } | null = null;
      if ((isCompleted || isCurrent) && hasGpsConsent && step.location) {
        const loc = step.location as { coordinates?: [number, number] };
        if (loc.coordinates) {
          coordinates = { lat: loc.coordinates[1], lng: loc.coordinates[0] };
        }
      }

      return {
        id: step.id,
        order: step.order,
        title: step.title,
        status,
        validation_radius: step.validation_radius,
        coordinates,
      };
    });

    return {
      progress_id: progress.id,
      hunt_id: huntId,
      current_step: progress.current_step,
      completed_steps: progress.completed_steps,
      total_points: progress.total_points,
      started_at: progress.started_at,
      completed_at: progress.completed_at,
      steps,
    };
  }
}
