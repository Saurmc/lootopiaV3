import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { HuntsModule } from '../hunts/hunts.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [HuntsModule, ProgressModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
