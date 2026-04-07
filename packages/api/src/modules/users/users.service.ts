import { ConflictException, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserEntity } from './entities/user.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findById(id);
  }

  async createUser(
    email: string,
    passwordHash: string,
    role: Role = Role.PLAYER,
  ): Promise<UserEntity> {
    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    return this.usersRepository.save({ email, password_hash: passwordHash, role });
  }
}
