import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HuntsController } from './hunts.controller';
import { HuntsService } from './hunts.service';
import { HuntsRepository } from './hunts.repository';
import { HuntEntity } from './entities/hunt.entity';
import { GeoModule } from '../geo/geo.module';
import { ProgressModule } from '../progress/progress.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HuntEntity]),
    GeoModule,
    forwardRef(() => ProgressModule),
    FilesModule,
  ],
  controllers: [HuntsController],
  providers: [HuntsService, HuntsRepository],
  exports: [HuntsService, HuntsRepository],
})
export class HuntsModule {}
