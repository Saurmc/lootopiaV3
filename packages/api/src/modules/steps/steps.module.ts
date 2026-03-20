import { Module } from '@nestjs/common';
import { StepsController } from './steps.controller';
import { StepsService } from './steps.service';
import { StepsRepository } from './steps.repository';

@Module({
  controllers: [StepsController],
  providers: [StepsService, StepsRepository],
})
export class StepsModule {}
