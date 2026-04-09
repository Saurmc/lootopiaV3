import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZonesController } from './zones.controller';
import { ZonesService } from './zones.service';
import { ZonesRepository } from './zones.repository';
import { ZoneEntity } from './entities/zone.entity';
import { HuntsModule } from '../hunts/hunts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ZoneEntity]),
    forwardRef(() => HuntsModule),
  ],
  controllers: [ZonesController],
  providers: [ZonesService, ZonesRepository],
  exports: [ZonesService, ZonesRepository],
})
export class ZonesModule {}
