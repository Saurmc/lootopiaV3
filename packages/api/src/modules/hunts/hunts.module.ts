import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HuntsController } from './hunts.controller';
import { HuntsService } from './hunts.service';
import { HuntsRepository } from './hunts.repository';
import { HuntEntity } from './entities/hunt.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HuntEntity])],
  controllers: [HuntsController],
  providers: [HuntsService, HuntsRepository],
  exports: [HuntsService, HuntsRepository],
})
export class HuntsModule {}
