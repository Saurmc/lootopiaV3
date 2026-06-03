import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { HuntsRepository } from '../hunts/hunts.repository';
import { ProgressRepository } from '../progress/progress.repository';

export interface AdminStatsDto {
  user_count: number;
  partner_count: number;
  player_count: number;
  hunt_count: number;
  active_hunt_count: number;
  participant_count: number;
  completed_count: number;
  completion_rate: number;
}

export interface PartnerDto {
  id: string;
  email: string | null;
  pseudo: string | null;
  hunt_count: number;
  active_hunt_count: number;
  created_at: Date;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly huntsRepository: HuntsRepository,
    private readonly progressRepository: ProgressRepository,
  ) {}

  async getGlobalStats(): Promise<AdminStatsDto> {
    const [users, hunts, progresses] = await Promise.all([
      this.usersRepository.findAll(),
      this.huntsRepository.findAllForStats(),
      this.progressRepository.findAll(),
    ]);

    const partner_count = users.filter((u) => u.role === 'PARTNER').length;
    const player_count = users.filter((u) => u.role === 'PLAYER' && !u.is_guest).length;
    const active_hunt_count = hunts.filter((h) => h.is_active).length;
    const participant_count = progresses.length;
    const completed_count = progresses.filter((p) => p.completed_at !== null).length;
    const completion_rate =
      participant_count > 0
        ? Math.round((completed_count / participant_count) * 100)
        : 0;

    return {
      user_count: users.filter((u) => !u.is_guest).length,
      partner_count,
      player_count,
      hunt_count: hunts.length,
      active_hunt_count,
      participant_count,
      completed_count,
      completion_rate,
    };
  }

  async getPartners(): Promise<PartnerDto[]> {
    const partners = await this.usersRepository.findByRole('PARTNER');
    const allHunts = await this.huntsRepository.findAllForStats();

    return partners.map((p) => {
      const partnerHunts = allHunts.filter((h) => h.partner_id === p.id);
      return {
        id: p.id,
        email: p.email,
        pseudo: p.pseudo ?? null,
        hunt_count: partnerHunts.length,
        active_hunt_count: partnerHunts.filter((h) => h.is_active).length,
        created_at: p.created_at,
      };
    });
  }
}
