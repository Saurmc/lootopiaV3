import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { HuntsModule } from '../hunts/hunts.module';
import { ProgressModule } from '../progress/progress.module';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [UsersModule, HuntsModule, ProgressModule, InvitationsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
