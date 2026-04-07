import { Module } from '@nestjs/common';
import { RgpdController } from './rgpd.controller';
import { RgpdService } from './rgpd.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [RgpdController],
  providers: [RgpdService],
})
export class RgpdModule {}
