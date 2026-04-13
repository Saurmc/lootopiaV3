import { Injectable, NotFoundException } from '@nestjs/common';
import { StepsRepository } from './steps.repository';
import { HuntsRepository } from '../hunts/hunts.repository';
import { StepEntity } from './entities/step.entity';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';

@Injectable()
export class StepsService {
  constructor(
    private readonly stepsRepository: StepsRepository,
    private readonly huntsRepository: HuntsRepository,
  ) {}

  private buildLocation(lat?: number, lng?: number): object | null {
    if (lat !== undefined && lng !== undefined) {
      return { type: 'Point', coordinates: [lng, lat] };
    }
    return null;
  }

  private async assertHuntOwnership(huntId: string, partnerId: string): Promise<void> {
    const hunt = await this.huntsRepository.findById(huntId);
    if (!hunt) {
      throw new NotFoundException(`Hunt ${huntId} not found`);
    }
    if (hunt.partner_id !== partnerId) {
      throw new NotFoundException(`Hunt ${huntId} not found`);
    }
  }

  async findByHunt(huntId: string): Promise<StepEntity[]> {
    const hunt = await this.huntsRepository.findById(huntId);
    if (!hunt) {
      throw new NotFoundException(`Hunt ${huntId} not found`);
    }
    return this.stepsRepository.findByHuntId(huntId);
  }

  async createStep(
    huntId: string,
    partnerId: string,
    dto: CreateStepDto,
  ): Promise<StepEntity> {
    await this.assertHuntOwnership(huntId, partnerId);
    return this.stepsRepository.save({
      hunt_id: huntId,
      order: dto.order,
      title: dto.title,
      description: dto.description ?? null,
      location: this.buildLocation(dto.lat, dto.lng),
      validation_radius: dto.validation_radius ?? 50,
      validation_type: dto.validation_type ?? 'gps',
      ar_content: dto.ar_content ?? null,
    });
  }

  async updateStep(
    huntId: string,
    stepId: string,
    partnerId: string,
    dto: UpdateStepDto,
  ): Promise<StepEntity> {
    await this.assertHuntOwnership(huntId, partnerId);

    const step = await this.stepsRepository.findById(stepId);
    if (!step || step.hunt_id !== huntId) {
      throw new NotFoundException(`Step ${stepId} not found in this hunt`);
    }

    const updates: Partial<StepEntity> = { id: stepId };
    if (dto.order !== undefined) updates.order = dto.order;
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.validation_radius !== undefined) updates.validation_radius = dto.validation_radius;
    if (dto.validation_type !== undefined) updates.validation_type = dto.validation_type;
    if (dto.ar_content !== undefined) updates.ar_content = dto.ar_content;
    if (dto.lat !== undefined && dto.lng !== undefined) {
      updates.location = this.buildLocation(dto.lat, dto.lng);
    }

    return this.stepsRepository.save(updates);
  }

  async deleteStep(
    huntId: string,
    stepId: string,
    partnerId: string,
  ): Promise<void> {
    await this.assertHuntOwnership(huntId, partnerId);

    const step = await this.stepsRepository.findById(stepId);
    if (!step || step.hunt_id !== huntId) {
      throw new NotFoundException(`Step ${stepId} not found in this hunt`);
    }

    await this.stepsRepository.deleteById(stepId);
  }
}
