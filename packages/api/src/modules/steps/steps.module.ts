import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StepsController } from './steps.controller';
import { StepsService } from './steps.service';
import { StepsRepository } from './steps.repository';
import { StepEntity } from './entities/step.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StepEntity])],
  controllers: [StepsController],
  providers: [StepsService, StepsRepository],
  exports: [StepsService, StepsRepository],
})
export class StepsModule {}
