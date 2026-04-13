import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProgressRepository } from './progress.repository';
import { HuntsRepository } from '../hunts/hunts.repository';
import { UsersRepository } from '../users/users.repository';
import { StepsRepository } from '../steps/steps.repository';
import { GeoService } from '../geo/geo.service';
import { BadgesService } from '../badges/badges.service';
import { ProgressEntity } from './entities/progress.entity';
import { ProgressMapDto, StepMapDto, StepStatus } from './dto/progress-map.dto';
import { ValidateStepDto } from './dto/validate-step.dto';
import { StepEntity } from '../steps/entities/step.entity';

@Injectable()
export class ProgressService {
  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly huntsRepository: HuntsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly stepsRepository: StepsRepository,
    private readonly geoService: GeoService,
    private readonly badgesService: BadgesService,
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

  async validateStep(
    userId: string,
    huntId: string,
    stepId: string,
    dto: ValidateStepDto,
  ): Promise<ProgressEntity> {
    const progress = await this.progressRepository.findByUserAndHunt(userId, huntId);
    if (!progress) {
      throw new NotFoundException('No progress found for this hunt');
    }

    const step = await this.stepsRepository.findById(stepId);
    if (!step || step.hunt_id !== huntId) {
      throw new NotFoundException(`Step ${stepId} not found in this hunt`);
    }

    if (progress.completed_steps.includes(step.order)) {
      throw new ConflictException('Step already validated');
    }

    if (step.order !== progress.current_step) {
      throw new BadRequestException('This is not the current step');
    }

    await this.validateByType(step, dto);

    const hunt = await this.huntsRepository.findByIdWithSteps(huntId);
    const totalSteps = hunt?.steps?.length ?? 0;
    const pointsEarned = hunt
      ? Math.floor(hunt.points / Math.max(1, progress.completed_steps.length + 1))
      : 0;

    const newCompletedSteps = [...progress.completed_steps, step.order];
    const isHuntComplete = totalSteps > 0 && newCompletedSteps.length === totalSteps;

    const saved = await this.progressRepository.save({
      ...progress,
      completed_steps: newCompletedSteps,
      current_step: progress.current_step + 1,
      total_points: progress.total_points + pointsEarned,
      completed_at: isHuntComplete ? new Date() : progress.completed_at,
    });

    if (isHuntComplete) {
      const allProgress = await this.progressRepository.findAllByUser(userId);
      const completedCount = allProgress.filter((p) => p.completed_at !== null).length;
      await this.badgesService.checkAndAwardHuntBadges(userId, completedCount);
    }

    return saved;
  }

  /**
   * Route la validation vers la stratégie correspondant au validation_type de l'étape.
   * Lève BadRequestException si les données fournies ne correspondent pas au type.
   */
  private async validateByType(step: StepEntity, dto: ValidateStepDto): Promise<void> {
    const type = step.validation_type ?? 'gps';

    switch (type) {
      case 'gps':
        await this.validateGps(step, dto);
        break;
      case 'qrcode':
        this.validateQrCode(step, dto);
        break;
      case 'quiz':
        this.validateQuiz(step, dto);
        break;
      case 'photo':
        this.validatePhoto(dto);
        break;
      default:
        throw new BadRequestException(`Unknown validation type: ${type}`);
    }
  }

  private async validateGps(step: StepEntity, dto: ValidateStepDto): Promise<void> {
    if (dto.lat === undefined || dto.lng === undefined) {
      throw new BadRequestException('GPS coordinates required for this step');
    }
    if (!step.location) {
      throw new BadRequestException('Step has no location configured');
    }
    const within = await this.geoService.isWithinRadius(
      dto.lat,
      dto.lng,
      step.location,
      step.validation_radius,
    );
    if (!within) {
      throw new BadRequestException('Player is not within validation radius');
    }
  }

  private validateQrCode(step: StepEntity, dto: ValidateStepDto): void {
    const expectedCode = (step.ar_content as Record<string, unknown> | null)?.expected_code as string | undefined;
    if (!expectedCode) {
      throw new BadRequestException('Step has no QR code configured');
    }
    if (!dto.qr_code) {
      throw new BadRequestException('QR code required for this step');
    }
    if (dto.qr_code !== expectedCode) {
      throw new BadRequestException('Invalid QR code');
    }
  }

  private validateQuiz(step: StepEntity, dto: ValidateStepDto): void {
    const expectedAnswer = (step.ar_content as Record<string, unknown> | null)?.answer as string | undefined;
    if (!expectedAnswer) {
      throw new BadRequestException('Step has no answer configured');
    }
    if (!dto.answer) {
      throw new BadRequestException('Answer required for this step');
    }
    if (dto.answer.toLowerCase().trim() !== expectedAnswer.toLowerCase().trim()) {
      throw new BadRequestException('Wrong answer');
    }
  }

  private validatePhoto(dto: ValidateStepDto): void {
    if (!dto.file_url) {
      throw new BadRequestException('Photo URL required for this step');
    }
    // La photo est acceptée automatiquement (validation manuelle hors scope)
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
        description: step.description,
        status,
        validation_radius: step.validation_radius,
        validation_type: step.validation_type ?? 'gps',
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
