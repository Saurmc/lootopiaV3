import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HuntsController } from './hunts.controller';
import { HuntsService } from './hunts.service';
import { HuntsRepository } from './hunts.repository';
import { HuntEntity } from './entities/hunt.entity';
import { GeoModule } from '../geo/geo.module';

@Module({
  imports: [TypeOrmModule.forFeature([HuntEntity]), GeoModule],
  controllers: [HuntsController],
  providers: [HuntsService, HuntsRepository],
  exports: [HuntsService, HuntsRepository],
})
export class HuntsModule {}
