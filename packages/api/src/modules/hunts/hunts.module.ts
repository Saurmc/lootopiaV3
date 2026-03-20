import { Module } from '@nestjs/common';
import { HuntsController } from './hunts.controller';
import { HuntsService } from './hunts.service';
import { HuntsRepository } from './hunts.repository';

@Module({
  controllers: [HuntsController],
  providers: [HuntsService, HuntsRepository],
})
export class HuntsModule {}
