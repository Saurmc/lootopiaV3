import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeoService } from './geo.service';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [GeoService],
  exports: [GeoService],
})
export class GeoModule {}
