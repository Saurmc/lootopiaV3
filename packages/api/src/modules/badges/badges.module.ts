import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';
import { BadgesRepository } from './badges.repository';
import { BadgeEntity } from './entities/badge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BadgeEntity])],
  controllers: [BadgesController],
  providers: [BadgesService, BadgesRepository],
  exports: [BadgesService, BadgesRepository],
})
export class BadgesModule {}
