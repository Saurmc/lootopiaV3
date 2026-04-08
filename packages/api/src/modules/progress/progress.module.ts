import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { ProgressRepository } from './progress.repository';
import { ProgressEntity } from './entities/progress.entity';
import { HuntsModule } from '../hunts/hunts.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProgressEntity]),
    forwardRef(() => HuntsModule),
    UsersModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService, ProgressRepository],
  exports: [ProgressService, ProgressRepository],
})
export class ProgressModule {}
