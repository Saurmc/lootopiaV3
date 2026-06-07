import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProgressModule } from '../progress/progress.module';
import { BadgesModule } from '../badges/badges.module';
import { UsersModule } from '../users/users.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [ProgressModule, BadgesModule, UsersModule, FilesModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
