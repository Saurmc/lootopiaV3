import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  findAll(): Promise<UserEntity[]> {
    return this.repo.find();
  }

  findByRole(role: string): Promise<UserEntity[]> {
    return this.repo.find({ where: { role: role as any }, order: { created_at: 'DESC' } });
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOneBy({ email });
  }

  findByDeviceToken(deviceToken: string): Promise<UserEntity | null> {
    return this.repo.findOneBy({ device_token: deviceToken });
  }

  save(user: Partial<UserEntity>): Promise<UserEntity> {
    return this.repo.save(user);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async updateConsentGps(id: string, consent: boolean): Promise<void> {
    await this.repo.update(id, { consent_gps: consent });
  }

  async setBlocked(id: string, is_blocked: boolean): Promise<void> {
    await this.repo.update(id, { is_blocked });
  }

  async incrementRefreshVersion(id: string): Promise<void> {
    await this.repo.increment({ id }, 'refresh_token_version', 1);
  }
}
